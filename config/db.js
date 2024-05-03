// backend/config/db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'dnxtpro',
  password: 'locoplaya',
  database: 'appstats',
  connectionLimit: 10,
});

module.exports = pool;
