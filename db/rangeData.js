// Module variables
var timeframe = 24*60*60*1000; // Calculate volatility over the last 24 hours
var since;
var updatePeriod = 30*1000; // Fetch new data every 30 seconds
var data = {}; // The data object that will be returned

// Set up event emitter
var EventEmitter = require('events').EventEmitter;
var rangeData = new EventEmitter();

var db = require('./db');
var RangeDataCollection = db.mongoose.model('RangeData',
  new db.mongoose.Schema({}),
  'RangeData');

var getRangeData = function() {
  since = new Date(Date.now() - timeframe);
  
  // Set up aggregation pipeline
  var pipe = [];

  pipe.push({
    $match: { date: { $gt: since }}
  });

  pipe.push({
    $group: {
      _id: null,
      high: { $max: "$price" },
      low: { $min: "$price" },
    }
  });

  pipe.push({
    $project: {
      _id: 0,
      range: { $divide: [
        { $subtract: ["$high", "$low"] },
        "$low"  
      ]}
    }
  });

  db
    .Trade
    .aggregate(pipe)
    .exec()
    .then(function(result) {
      data.range = result[0].range;
    })
    .then(function() {
      return RangeDataCollection
        .find({})
        .exec();
    })
    .then(function(result) {
      result = result[0].toObject();
      data.average = result.average;
      data.high = result.high;
      data.low = result.low;
      var count = 0;
      result.values.forEach(function(value) {
        if (value < data.range) count++;
      });
      data.percentile = count / result.values.length;
      rangeData.emit('update', data);
      setTimeout(getRangeData, updatePeriod);
    });
};

getRangeData();

rangeData.get = function() {
  return data;
};

module.exports = rangeData;
