var tradeListenerUrl = 'http://QuoteServer.azurewebsites.net:80';

// Set up server
var port = process.env.PORT || 3000;
var server = require('http').Server();
var io = require('socket.io')(server);
server.listen(port, function() {
  console.log('listening on port', port);
});

////////////////////
// Channels
////////////////////

// Trades
// Data format:
// {
//     exchange: String,
//     date: Date,
//     price: Number,
//     amount: Number,
//     currency: 'BTC',
//     tCurrency: 'USD',
//     exchangeTradeID: String
// }
var ioClient = require('socket.io-client');
var tradeListener = ioClient(tradeListenerUrl);
tradeListener.on('trade', function(data) {
  console.log(data);
  io.of('/BTC/USD/trades').emit('trade', data);
});

// Volatility
// Data format:
// {
//     volatility: Number,
//     percentile: Number,
//     average: Number,
//     high: Number,
//     low: Number
// }
// io.of('/BTC/USD/volatility').emit('update', data);

// Volume
// Data format:
// {
//     volume: Number,
//     percentile: Number,
//     average: Number,
//     high: Number,
//     low: Number
// }
// io.of('/BTC/USC/volume').emit('update', data);

// Volume Weighted Average Price
// Data format:
// {
//     vwap: Number,
//     change: Number,
// }
// io.of('/BTC/USD/vwap').emit('update', data);

// Range
// Data format:
// {
//     range: Number, // as a percentage
//     percentile: Number,
//     average: Number,
//     high: Number,
//     low: Number
// }
// io.of('/BTC/USD/range').emit('update', data);

// New High/Low/stable
// This component would have one of four states
// If a new 24 hour high has been made in the last
// 24 hours: 'Trending Up'
// If a new 24 hour low has been made in the last
// 24 hours: 'Trending Down'
// If both: 'Open Range' // Find a proper name for this
// If neither: 'Range Bound'
// Data format:
// {
//     state: String
// }
// io.of('/BTC/USD/trend').emit('update', data);

// To be included:
// channels for various charts


