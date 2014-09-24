// Module variables
var timeframe = 24*60*60*1000; // Calculate volatility over the last 24 hours
var since;
var updatePeriod = 30*1000; // Fetch new data every 30 seconds
var data = {}; // The data object that will be returned

// Set up event emitter
var EventEmitter = require('events').EventEmitter;
var summaryData = new EventEmitter();

// Set up database connection
var db = require('./db');
var mongoose = db.mongoose;
var connection = db.connection;
var Trade = db.Trade;

var getSummaryData = function() {
  since = new Date(Date.now() - timeframe);

  // Set up aggregation pipeline
  var pipe = [];

  // Select trades since given date
  pipe.push({ 
    $match : { date : { $gt : since } }
  });

  pipe.push({
    $group: {
      _id: null,
      high: { $max: "$price" },
      low: { $min: "$price" },
      pq: { $sum: { $multiply: ["$price", "$amount"] } },
      volume: { $sum: "$amount" },
      numTrades: { $sum: 1 },
      trades: { $push: { price: "$price", amount: "$amount" } }
    }
  });

  pipe.push({
    $project: {
      vwap: { $divide: [ "$pq", "$volume" ] },
      high: 1,
      low: 1,
      volume: 1,
      numTrades: 1,
      trades: 1
    }
  });

  pipe.push({ $unwind: "$trades" });

  pipe.push({
    $project: {
      high: 1,
      low: 1,
      vwap: 1,
      volume: 1,
      numTrades: 1,
      trades: 1,
      weightedSquaredError: {
        $multiply: [
          { $subtract: ["$trades.price", "$vwap"]},
          { $subtract: ["$trades.price", "$vwap"]},
          "$trades.amount"
        ]
      }
    }
  });

  pipe.push({
    $group: {
      _id: null,
      high: { $first: "$high" },
      low: { $first: "$low" },
      vwap: { $first: "$vwap" },
      volume: { $first: "$volume" },
      numTrades: { $first: "$numTrades" },
      sumSquares: { $sum: "$weightedSquaredError" }
    }
  });

  pipe.push({
    $project: {
      _id: 0,
      high: 1,
      low: 1,
      vwap: 1,
      volume: 1,
      numTrades: 1,
      variance: { $divide: ["$sumSquares", "$volume"]},
      range: { $divide: [
        { $subtract: ["$high", "$low"] },
        "$vwap"
      ]},
    }
  });

  Trade
    .aggregate(pipe)
    .exec()
    .then(function(result) {
      data = result[0];
      data.standardDeviation = Math.sqrt(data.variance);
      data.coefficientOfVariation = data.standardDeviation / data.vwap;
      summaryData.emit('update', data);
      setTimeout(getSummaryData, updatePeriod);
    });
};

getSummaryData();

summaryData.get = function() {
  return data;
};

module.exports = summaryData;
