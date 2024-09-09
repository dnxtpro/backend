const playersController = require("../controllers/positions.controller.js");

module.exports = app => {
  var router = require("express").Router();

  // Ruta para obtener todos los jugadores
  router.get("/positions/all", playersController.findPositions); // Solo la función de controlador, sin middleware
  
  app.use('/api', router);
};
