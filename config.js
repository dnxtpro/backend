const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(__dirname, process.env.NODE_ENV+'.env')
});
console.log(process.env.PASS)

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST : process.env.HOST,
  USER : process.env.SQLUSER,
  PASS: process.env.PASS,

  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
 
}