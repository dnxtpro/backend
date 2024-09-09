const { authJwt } = require("../middleware");


module.exports = app => {
  const partidos = require("../controllers/partido.controller.js");

  var router = require("express").Router();

  // Ruta para obtener todos los partidos de un usuario específico
 
  router.get("/partidos/user", [authJwt.verifyToken], partidos.findByUser);
  app.use('/api', router);
};
