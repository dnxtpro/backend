const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(__dirname, `${process.env.NODE_ENV || 'development'}.env`)
});

module.exports = {
    HOST: process.env.HOST || '127.0.0.1',
    PORT: Number(process.env.DB_PORT || 3306),
    USER: process.env.SQLUSER,
    PASSWORD: process.env.PASS,
    DB: process.env.DB_NAME,
    dialect: "mysql",
    pool: {
      max:5,
      min: 0,
      acquire:process.env.DB_POOL_ACQUIRE,
      idle: process.env.DB_POOL_IDLE
    }
  };