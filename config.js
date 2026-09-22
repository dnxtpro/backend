const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: process.env.ENV_FILE || path.resolve(__dirname, '.env')
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || '127.0.0.1',
  PORT: Number(process.env.DB_PORT || 3306),
  USER: process.env.SQLUSER || 'root',
  PASS: process.env.PASS || '',
  DB_NAME: process.env.DB_NAME || 'appstats',
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};