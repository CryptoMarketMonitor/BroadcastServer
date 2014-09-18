// Module variables
var timeframe = 24*60*60*1000; // Calculate volatility over the last 24 hours
var since;
var updatePeriod = 30*1000; // Fetch new data every 30 seconds
var data = {}; // The data object that will be returned

// Set up event emitter
var EventEmitter = require('events').EventEmitter;
var varianceData = new EventEmitter();

// Set up database connection
var db = require('./db');
var mongoose = db.mongoose;
var connection = db.connection;
var Trade = db.Trade;
var VarianceDataCollection = mongoose.model('VarianceData', 
  new mongoose.Schema({}), 
  'VarianceData');

var getVarianceData = function() {
  since = new Date(Date.now() - timeframe);

  // Set up aggregation pipeline
  var pipe = [];

  pipe.push({ 
    $match : { date : { $gt : since } }
  });

  pipe.push({
    $group: {
      _id: null,
      pq: { $sum: { $multiply: ["$price", "$amount"] } },
      volume: { $sum: "$amount" },
      trades: { $push: { price: "$price", amount: "$amount" } }
    }
  });

  pipe.push({
    $project: {
      vwap: { $divide: [ "$pq", "$volume" ] },
      volume: 1,
      trades: 1
    }
  });

  pipe.push({ $unwind: "$trades" });

  pipe.push({
    $project: {
      volume: 1,
      weightedSquaredError: {
        $multiply: [
          { $subtract: ["$trades.price", "$vwap"] },
          { $subtract: ["$trades.price", "$vwap"] },
          "$trades.amount"
        ]
      }
    }
  });

  pipe.push({
    $group: {
      _id: null,
      volume: { $first: "$volume" },
      sumSquares: { $sum: "$weightedSquaredError" }
    }
  });

  pipe.push({
    $project: {
      _id: 0,
      variance: { $divide: ["$sumSquares", "$volume"] }
    }
  });

  Trade
    .aggregate(pipe)
    .exec()
    .then(function(result) {
      data.variance = result[0].variance;
      data.standardDeviation = Math.sqrt(data.variance);
    })
    .then(function() {
      return VarianceDataCollection.find({}).exec();
    })
    .then(function(result) {
      result = result[0].toObject();
      data.average = result.average;
      data.high = result.high;
      data.low = result.low;
      var num = result.values.length;
      var count = 0;
      result.values.forEach(function(value) {
        if (value < data.variance) count++;
      });
      data.percentile = count/num;
      varianceData.emit('update', data);
      setTimeout(getVarianceData, updatePeriod);
    });
};

getVarianceData();

varianceData.get = function() {
  return data;
};

module.exports = varianceData;
