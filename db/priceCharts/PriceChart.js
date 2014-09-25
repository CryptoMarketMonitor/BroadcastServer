var EventEmitter = require('events').EventEmitter;
var util = require('util');
var db = require('../db');

var PriceChart = function(minutesPerDataPoint, numDataPoints, updatePeriod) {
    EventEmitter.call(this);
    this.updatePeriod = updatePeriod || 30*1000;
    this.data = {};
    this.minutesPerDataPoint = minutesPerDataPoint || 15;
    this.numDataPoints = numDataPoints || 102;
    this.totalTime = this.numDataPoints * this.minutesPerDataPoint * 60 * 1000;
    this.getData();
}
util.inherits(PriceChart, EventEmitter);

PriceChart.prototype.getData = function() {
  var context = this;
  var since = new Date(Date.now() - this.totalTime);
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
        minute: { $subtract: [
          { $minute: "$date" },
          { $mod: [ { $minute: "$date"}, this.minutesPerDataPoint ]}
        ]}
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

  pipe.push({
    $skip: 1
  });

  db
    .Trade
    .aggregate(pipe)
    .exec()
    .then(function(result) {
      context.data = result;
      for (var i = 0; i < context.data.length; i++) {
        context.data[i].date = new Date(Date.UTC(
                            context.data[i]._id.year,
                            context.data[i]._id.month - 1, 
                            context.data[i]._id.day,
                            context.data[i]._id.hour,
                            context.data[i]._id.minute
                        ));
        delete context.data[i]._id;
      }
      context.emit('update', context.data);
      setTimeout(context.getData.bind(context), context.updatePeriod);
    
    }, function(error) {
      console.error('Error Aggregating PriceChart:', error);
    });
};

PriceChart.prototype.get = function() {
  return this.data;
};

module.exports = PriceChart;