const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const MatchEvent = require('../models/matchevent');

const httpServer = require('http').createServer(); 
const {WebSocketServer} = require('ws');
const wss=new WebSocketServer({server:httpServer});




module.exports = router;
