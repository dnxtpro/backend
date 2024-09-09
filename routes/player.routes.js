const playersController = require("../controllers/players.controller.js");

module.exports = app => {
  var router = require("express").Router();

  // Ruta para obtener todos los jugadores
  router.get("/players/all",verifyToken, playersController.findPlayers); // Solo la función de controlador, sin middleware
  router.post('/players/all', verifyToken, playersController.createPlayer);
  app.use('/api', router);
};
