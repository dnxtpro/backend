require('dotenv').config();
const mysql = require('mysql2');
const config = require('../config') ;

console.log(config.SQL);
console.log(config.SQLUSER);
console.log(config.PASS);
const pool = mysql.createPool({
  host: 'localhost',
  user: 'dnxtpro',
  password: 'locoplaya',
  database: 'appstats',
  connectionLimit: 10,
  
});

module.exports = pool;
