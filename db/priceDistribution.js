// Module variables
var timeframe = 24*60*60*1000; // Calculate volatility over the last 24 hours
var since;
var updatePeriod = 30*1000; // Fetch new data every 30 seconds
var data = {}; // The data object that will be returned

// Set up event emitter
var EventEmitter = require('events').EventEmitter;
var priceDistribution = new EventEmitter();

// Set up database connection
var db = require('./db');

var getPriceDistribution = function() {
  since = new Date(Date.now() - timeframe);
  
  // Set up aggregation pipeline
  var pipe = [];

  // Select trades since given date
  pipe.push({ 
    $match : { date : { $gt : since } }
  });

  // Trades need to be put in buckets to make a historgram
  // This hard codes one dollar buckets (for now)
  // This does -> price = Math.floor(price)
  pipe.push({
    $project : { 
      amount : 1, 
      exchange : 1, 
      price : { $subtract : ["$price", { $mod : ["$price", 1] } ] } 
    } 
  });

  // Group by price and exchange and sum volume for each
  // unique exchange and price bucket
  // This will be the fundamental data point
  pipe.push({ 
    $group : { 
      _id : { exchange: "$exchange", price: "$price" }, 
      volume : { $sum : "$amount" } 
    }
  });

  // Flatten the _id object used to group the buckets
  pipe.push({ 
    $project : { 
      exchange : "$_id.exchange", 
      price: "$_id.price", 
      volume: 1, 
      _id: 0
    } 
  });

  // Sort by exchange, and then price
  // This makes it easier to enter into data structure
  // compatible with charting library
  pipe.push({ 
    $sort : { 
      exchange: 1, 
      price: 1 
    } 
  });

  db
    .Trade
    .aggregate(pipe)
    .exec()
    .then(function(result) {
      data = result;
      priceDistribution.emit('update', data);
      setTimeout(getPriceDistribution, updatePeriod);
    });
};

getPriceDistribution();

priceDistribution.get = function() {
  return data;
};

module.exports = priceDistribution;
