/**
 * tests/helpers/testApp.js
 * 
 * Creates a minimal Express app for testing that does NOT connect to the DB.
 * This lets middleware and route-level tests run without a live MySQL instance.
 */

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

module.exports = app;
