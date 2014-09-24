var _ = require('lodash');

// Module variables
var timeframe = 24*60*60*1000; // Calculate volatility over the last 24 hours
var since;
var updatePeriod = 30*1000; // Fetch new data every 30 seconds
var data = {}; // The data object that will be returned

// Set up event emitter
var EventEmitter = require('events').EventEmitter;
var varianceData = new EventEmitter();
var standardDeviation = new EventEmitter();
var coefficientOfVariation = new EventEmitter();

// Set up database connection
var db = require('./db');
var mongoose = db.mongoose;
var connection = db.connection;
var Trade = db.Trade;
var VolatilityDataCollection = mongoose.model('VolatilityData', 
  new mongoose.Schema({}), 
  'VolatilityData');

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
      numTrades: { $sum: 1 },
      trades: { $push: { price: "$price", amount: "$amount" } }
    }
  });

  pipe.push({
    $project: {
      vwap: { $divide: [ "$pq", "$volume" ] },
      volume: 1,
      trades: 1,
      numTrades: 1,
    }
  });

  pipe.push({ $unwind: "$trades" });

  pipe.push({
    $project: {
      volume: 1,
      vwap: 1,
      numTrades: 1,
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
      numTrades: { $first: "$numTrades" },
      vwap: { $first: "$vwap" },
      sumSquares: { $sum: "$weightedSquaredError" }
    }
  });

pipe.push({
  $project: {
    vwap: 1,
    variance: { $divide: ["$sumSquares", 
      { $divide: [
        { $multiply: [
          { $subtract: [ "$numTrades", 1 ]},
          "$volume"
        ]},
        "$numTrades"
      ]}
    ]}
  }
});

  Trade
    .aggregate(pipe)
    .exec()
    .then(function(result) {
      data.standardDeviation = {};
      data.standardDeviation.value = Math.sqrt(result[0].variance);
      data.coefficientOfVariation = {};
      data.coefficientOfVariation.value = data.standardDeviation.value / result[0].vwap;
    })
    .then(function() {
      return VolatilityDataCollection.find({}).exec();
    })
    .then(function(result) {
      result = result[0].toObject();
      _.extend(data.standardDeviation, result.standardDeviation);
      _.extend(data.coefficientOfVariation, result.coefficientOfVariation);
      
      var count = 0;
      _.each(result.standardDeviation.values, function(value) {
        if (value < data.standardDeviation.value) count++;
      });
      data.standardDeviation.percentile = count / result.standardDeviation.values.length;
      delete data.standardDeviation.values;

      count = 0;
      _.each(result.coefficientOfVariation.values, function(value) {
        if (value < data.coefficientOfVariation.value) count++;
      })
      data.coefficientOfVariation.percentile = count / result.coefficientOfVariation.values.length;
      delete data.coefficientOfVariation.values;

      varianceData.emit('update', data);
      standardDeviation.emit('update', data.standardDeviation);
      coefficientOfVariation.emit('update', data.coefficientOfVariation);
      setTimeout(getVarianceData, updatePeriod);
    });
};

getVarianceData();

varianceData.get = function() {
  return data;
};

standardDeviation.get = function() {
  return data.standardDeviation;
};

coefficientOfVariation.get = function() {
  return data.coefficientOfVariation;
};

module.exports = {
  varianceData: varianceData,
  standardDeviation: standardDeviation,
  coefficientOfVariation: coefficientOfVariation
};
