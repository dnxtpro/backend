const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(__dirname, '..', `${process.env.NODE_ENV || 'development'}.env`)
});

const config = {
  username: process.env.SQLUSER,
  password: process.env.PASS,
  database: process.env.DB_NAME,
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
    idle: Number(process.env.DB_POOL_IDLE || 10000)
  }
};

module.exports = {
  development: config,
  test: config,
  production: config
};
