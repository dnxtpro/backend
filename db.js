const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('appstats', 'dnxt', 'locoplaya', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
