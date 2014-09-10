var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);
var connection = mongoose.connection;
var Trade = mongoose.model('Trade', 
  new mongoose.Schema({}),
  'trades');

connection.on('error', function(error) {
  console.error('Mongoose encountered an error:', error);
});

connection.once('open', function() {
  console.log('Mongoose successfully connected with the database');
});

module.exports = {
  mongoose: mongoose,
  connection: connection,
  Trade: Trade
};