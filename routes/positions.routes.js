const playersController = require("../controllers/positions.controller.js");

module.exports = app => {
  var router = require("express").Router();

  // Ruta para obtener todos los jugadores
  router.get("/positions/all", playersController.findPositions); 
  router.patch("/positions1", playersController.positions)
  
  app.use('/api', router);
};
