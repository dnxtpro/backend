const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const playerRoutes = require('./routes/playerroutes');
const partido = require('./routes/partido');
const matchRoutes = require('./routes/matchRoutes');
const cors = require('cors');
require('dotenv').config();
 // Import the WebSocket library

const app = express();
const server = http.createServer(app);
// Create a WebSocket server instance

app.use(cors());
app.use(express.json());
app.use('/api', playerRoutes);
app.use('/api', partido);
app.use('/api', matchRoutes);

// Handle WebSocket connection
const PORT = process.env.PORT || 4001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
