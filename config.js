const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(__dirname, process.env.NODE_ENV+'.env')
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  SQL : process.env.SQL,
  USER : process.env.USER,
  PASS: process.env.PASS,
  SQLUSER : process.env.SQLUSER,
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
 
}