// Module variables
var timeframe = 24*60*60*1000; // Calculate volatility over the last 24 hours
var since = new Date(Date.now() - timeframe);
var updatePeriod = 30*1000; // Fetch new data every 30 seconds
var data = {}; // The data object that will be returned

// Set up event emitter
var EventEmitter = require('events').EventEmitter;
var volumeData = new EventEmitter();

// Set up database connection
var db = require('./db');
var mongoose = db.mongoose;
var connection = db.connection;
var Trade = db.Trade;
var VolumeDataCollection = mongoose.model('VolumeData', 
  new mongoose.Schema({}), 
  'VolumeData');

// Set up aggregation pipeline
var pipe = [];

pipe.push({ 
  $match : { date : { $gt : since } }
});

pipe.push({
  $group: {
    _id: null,
    volume: { $sum: "$amount" }
  }
});

var getVolumeData = function() {
  Trade
    .aggregate(pipe)
    .exec()
    .then(function(result) {
      data.volume = result[0].volume;
    })
    .then(function() {
      return VolumeDataCollection.find({}).exec();
    })
    .then(function(result) {
      result = result[0].toObject();
      data.average = result.average;
      data.high = result.high;
      data.low = result.low;
      var count = 0;
      result.values.forEach(function(value) {
        if (value < data.volume) count++;
      });
      data.percentile = count/result.values.length;
      volumeData.emit('update', data);
      setTimeout(getVolumeData, updatePeriod);
    });
};

getVolumeData();

volumeData.get = function() {
  return data;
};

module.exports = volumeData;
