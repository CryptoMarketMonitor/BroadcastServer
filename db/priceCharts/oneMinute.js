// Module variables
var timeframe = 100*60*1000;
var since;
var updatePeriod = 30*1000; // Fetch new data every 30 seconds
var data = {}; // The data object that will be returned

// Set up event emitter
var EventEmitter = require('events').EventEmitter;
var oneMinute = new EventEmitter();

// Set up database connection
var db = require('../db');

var getData = function() {
  since = new Date(Date.now() - timeframe);
  
  // Set up aggregation pipeline
  var pipe = [];

  pipe.push({ 
    $match : { 
      date : { $gt : since } 
    }
  });

  pipe.push({
    $group: {
      _id: { 
        month: { $month: "$date" }, 
        day: { $dayOfMonth: "$date" }, 
        year: { $year: "$date" }, 
        hour: { $hour: "$date"}, 
        minute: { $minute: "$date"} 
      },
      high: { $max: "$price" },
      low: { $min: "$price" },
      open: { $first: "$price" },
      close: { $last: "$price" },
      pq: { $sum: { $multiply: ["$price", "$amount"] } },
      volume: { $sum: "$amount" },
      meanTradeSize: { $avg: "$amount" },
      numTrades: { $sum: 1 },
      trades: { $push: { price: "$price", amount: "$amount" } }
    }
  });

  pipe.push({
    $project: {
      vwap: { $divide: [ "$pq", "$volume" ] },
      high: 1,
      low: 1,
      open: 1,
      close: 1,
      volume: 1,
      meanTradeSize: 1,
      numTrades: 1
    }
  });

  pipe.push({
    $sort: { _id: 1 }
  });

  db
    .Trade
    .aggregate(pipe)
    .exec()
    .then(function(result) {
      data = result;
      for (var i = 0; i < data.length; i++) {
        data[i].date = new Date(Date.UTC(
                            data[i]._id.year,
                            data[i]._id.month, 
                            data[i]._id.day,
                            data[i]._id.hour,
                            data[i]._id.minute
                        ));
        delete data[i]._id;
      }
      oneMinute.emit('update', data);
      setTimeout(getData, updatePeriod);
    });
};

getData();

oneMinute.get = function() {
  return data;
};

module.exports = oneMinute;
