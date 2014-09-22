var PriceChart = require('./PriceChart');

var priceCharts = {};

priceCharts.oneMinute = new PriceChart(1, 5);
priceCharts.fiveMinutes = new PriceChart(5, 5);
priceCharts.fifteenMinutes = new PriceChart(15, 5);
priceCharts.oneHour = new PriceChart(60, 5);

module.exports = priceCharts;
