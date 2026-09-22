const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: process.env.ENV_FILE || path.resolve(__dirname, '..', '.env')
});

module.exports = {
    HOST: process.env.HOST || '127.0.0.1',
    PORT: Number(process.env.DB_PORT || 3306),
  USER: process.env.SQLUSER || 'root',
  PASSWORD: process.env.PASS || '',
  DB: process.env.DB_NAME || 'appstats',
    dialect: "mysql",
    pool: {
      max:5,
      min: 0,
      acquire:process.env.DB_POOL_ACQUIRE,
      idle: process.env.DB_POOL_IDLE
    }
  };