BroadcastServer
===============

Broadcasts cryptocurrency market data for consumption by client side applications.


Url: http://broadcastserver.azurewebsites.net

----------
Socket.io Channels
===============


----------

Trades
**/BTC/USD/trades**
Event: 'trade'
Data Format:

    {
      exchange: String,
      date: Date,
      price: Number,
      amount: Number,
      currency: 'BTC',
      tCurrency: 'USD',
      exchangeTradeID: String
    }
 
----------
Market Summary Statistics
**/BTC/USD/summary**
Event: 'update'
Data Format:

    {
      vwap: Number,
      volume: Number,
      high: Number,
      low: Number,
      volatility: Number,
      range: Number,
      numTrades: Number
    }


----------


Volatility Details
**/BTC/USD/volatility**
Event: 'update'
Data Format:

    {
      volatility: Number,
      percentile: Number,
      average: Number,
      high: Number,
      low: Number
    }


----------


Range Details
**/BTC/USD/range**
Event: 'update'
Data Format:

    {
      range: Number,
      percentile: Number,
      average: Number,
      high: Number,
      low: Number
    }


----------


Volume Details
**/BTC/USD/volume**
Event: 'update'
Data Format:

    {
      volume: Number,
      percentile: Number,
      average: Number,
      high: Number,
      low: Number
    }


----------


Price Distribution Chart Data
**/BTC/USD/priceDistribution**
Event: 'update'
Data Format:

    // An array of datapoints
    [
      {
        exchange: String,
        price: Number,
        volume: Number
      },
      ...
  ]


----------
Example Usage
============

Include Socket.io:
    

    <script src="https://cdn.socket.io/socket.io-1.0.6.js"></script>
    


----------

  <script>
      var trade = io('http://broadcastserver.azurewebsites.net/BTC/USD/trades');
      trade.on('trade', function(trade) {
        console.log('Trade:', trade);
      });
  
      var summary = io('http://broadcastserver.azurewebsites.net/BTC/USD/summary');
      summary.on('update', function(data) {
        console.log('Summary Data', data);
      });
  
      var volatility = io('http://broadcastserver.azurewebsites.net/BTC/USD/volatility');
      volatility.on('update', function(data) {
        console.log('Volatility Details', data);
      });
  
      var range = io('http://broadcastserver.azurewebsites.net/BTC/USD/range');
      range.on('update', function(data) {
        console.log('Range Details', data);
      });
  
      var volume = io('http://broadcastserver.azurewebsites.net/BTC/USD/volume');
      volume.on('update', function(data) {
        console.log('Volume Details', data);
      });
  
      var priceDistribution =
        io('http://broadcastserver.azurewebsites.net/BTC/USD/priceDistribution');
      priceDistribution.on('update', function(data) {
        console.log('Price Distribution', data);
      });
    </script>