const FaultType = require("../controllers/faulttype.controller")

module.exports = app => {
  var router = require("express").Router();

  // Ruta para obtener todos los jugadores
  router.get("/faulttypes/all", FaultType.findFaulttypes); // Solo la función de controlador, sin middleware
  
  app.use('/api', router);
};
