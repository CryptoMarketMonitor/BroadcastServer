var tradeListenerUrl = 'http://QuoteServer.azurewebsites.net:80';

// Set up server
var port = process.env.PORT || 3000;
var url = require('url');
var server = require('http').Server();
var io = require('socket.io')(server);
server.listen(port, function() {
  console.log('listening on port', port);
});

////////////////////
// Channels       //
////////////////////

// Trades
var tradeListener = require('socket.io-client')(tradeListenerUrl);
tradeListener.on('trade', function(data) {
  io.of('/BTC/USD/trades').emit('trade', data);
});

// Volatility
var volatility = require('./db/volatilityData');
for (var stream in volatility) {
  volatility[stream].on('update', function(data) {
    io.of('/BTC/USD/' + this).emit('update', data);
  }.bind(stream));
  io.of('BTC/USD/' + stream).on('connection', function(socket) {
    socket.emit('update', volatility[this].get());
  }.bind(stream));
}

// Volume
var volumeData = require('./db/volumeData');
volumeData.on('update', function(data) {
  io.of('BTC/USD/volume').emit('update', data);
});
io.of('BTC/USD/volume').on('connection', function(socket) {
  socket.emit('update', volumeData.get());
});

// Summary Data
var summaryData = require('./db/summaryData');
summaryData.on('update', function(data) {
  io.of('BTC/USD/summary').emit('update', data);
});
io.of('BTC/USD/summary').on('connection', function(socket) {
  socket.emit('update', summaryData.get());
});

// Range
var rangeData = require('./db/rangeData');
rangeData.on('update', function(data) {
  io.of('BTC/USD/range').emit('update', data);
});
io.of('BTC/USD/range').on('connection', function(socket) {
  socket.emit('update', rangeData.get());
});

// Price Distribution
var priceDistribution = require('./db/priceDistribution');
priceDistribution.on('update', function(data) {
  io.of('BTC/USD/priceDistribution').emit('update', data);
});
io.of('BTC/USD/priceDistribution').on('connection', function(socket) {
  socket.emit('update', priceDistribution.get());
});

// Price Charts
var priceCharts = require('./db/priceCharts/priceCharts');
for (var chart in priceCharts) {
  priceCharts[chart].on('update', function(data) {
    io.of('BTC/USD/priceCharts/' + this).emit('update', data);
  }.bind(chart));
  io.of('BTC/USD/priceCharts/' + chart).on('connection', function(socket) {
    socket.emit('update', priceCharts[this].get());
  }.bind(chart));
}

