const express = require('express');
const http = require('http');
const socketIO = require('socket.io');


const config = require('./config.js')

const cookieSession = require("cookie-session");
const cors = require('cors');

console.log(`Your port is ${process.env.PORT}`); // undefined
const dotenv = require('dotenv');
dotenv.config();
console.log(`Your port is ${process.env.SQL}`); // 8626
 // Import the WebSocket library

const app = express();
const server = http.createServer(app);
// Create a WebSocket server instance

app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "bezkoder-session",
    keys: ["COOKIE_SECRET"], // should use as secret environment variable
    httpOnly: true,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to roche application." });
});
const corsOptions = {
  origin: 'https://nervagest.ma', // Especifica el origen permitido
  credentials: true, // Importante: Permite el envío de credenciales
};

app.use(cors(corsOptions));
app.use(express.json());

const db = require("./model");
const Role = db.role;


db.sequelize.sync({ alter: true }).then(() => {
  console.log('Database synchronized with alterations');
  initial(); // Creación de roles iniciales
}).catch(err => {
  console.error('Failed to synchronize database:', err);
});



function initial() {
  Role.findOrCreate({
    where: { id: 1 },
    defaults: { name: "user" }
  });

  Role.findOrCreate({
    where: { id: 2 },
    defaults: { name: "moderator" }
  });

  Role.findOrCreate({
    where: { id: 3 },
    defaults: { name: "admin" }
  });
}
require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);
require('./routes/partido.routes')(app);
require('./routes/player.routes')(app);
require('./routes/positions.routes')(app);
require('./routes/faulttypes.routes')(app);
require('./routes/matchevent.route')(app);
require('./routes/team.routes')(app);


const PORT = process.env.PORT || 4001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
