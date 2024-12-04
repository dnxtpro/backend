const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport/index.js");
const { authJwt } = require("../middleware");
const { verifyToken } = require("../middleware/authJwt.js");


module.exports = app => {
  const partidos = require("../controllers/partido.controller.js");

  var router = require("express").Router();

  router.post("/partidos/user",[verifyToken,authJwt.isModeratorOrAdmin],partidos.createMatch);
 
  router.get("/partidos/user", [authJwt.verifyToken], partidos.findByUser);
  router.get("/latest-match-details",[authJwt.verifyToken],partidos.detallesUltimos)
  router.delete("/borrar-partido/:matchId",[authJwt.verifyToken,authJwt.isModeratorOrAdmin],partidos.deleteMatch)
  app.use('/api', router);

};
  