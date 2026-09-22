const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport/index.js");
const { authJwt, validateSchema } = require("../middleware");
const { verifyToken } = require("../middleware/authJwt.js");
const { createMatchSchema } = require("../schemas/partido.schema.js");

module.exports = app => {
  const partidos = require("../controllers/partido.controller.js");

  var router = require("express").Router();

  router.post("/partidos/user",[verifyToken,authJwt.isModeratorOrAdmin, validateSchema(createMatchSchema)],partidos.createMatch);
 
  router.get("/partidos/user", [authJwt.verifyToken], partidos.findByUser);
  router.get("/latest-match-details",[authJwt.verifyToken],partidos.detallesUltimos)
  router.delete("/borrar-partido/:matchId",[authJwt.verifyToken,authJwt.isModeratorOrAdmin],partidos.deleteMatch)

  router.get("/partidos/:matchId/details", [authJwt.verifyToken], partidos.getMatchDetails);
  router.get("/partidos/:matchId/youtube", [authJwt.verifyToken], partidos.getYoutubeId);
  router.put("/partidos/:matchId/youtube", [authJwt.verifyToken, authJwt.isModeratorOrAdmin], partidos.updateYoutubeId);

  app.use('/api', router);

};
  