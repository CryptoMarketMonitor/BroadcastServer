var PriceChart = require('./PriceChart');

var priceCharts = {};

priceCharts.oneMinute = new PriceChart(1);
priceCharts.fiveMinutes = new PriceChart(5);
priceCharts.fifteenMinutes = new PriceChart(15);
priceCharts.oneHour = new PriceChart(60);

module.exports = priceCharts;
