const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(__dirname, process.env.NODE_ENV+'.env')
});
console.log(process.env)
module.exports = {
    HOST: process.env.HOST,
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