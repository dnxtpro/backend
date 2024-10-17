const { authJwt } = require("../middleware");
const { verifyToken } = require("../middleware/authJwt.js");


module.exports = app => {
  const matchevent = require("../controllers/matchevents.controller.js");
  const ev= require("../controllers/delete.controller.js")

  var router = require("express").Router();

  router.post("/matchevent/user",[verifyToken, authJwt.isModeratorOrAdmin],matchevent.createEvent);
  router.get("/matchevent/:matchId",[verifyToken],matchevent.getEventDetails);
  router.get("/lastevents/:matchId",matchevent.ultimoseventos);
  router.get("/resumen/jugador/:matchId",[verifyToken],matchevent.resumenJugador);
  router.delete("/matchevents/delete-last",ev.borrarevento);
  router.get("/matchevents/getLatest",matchevent.obtenerUltimoevento);
  router.get("/marcador",matchevent.marcador)
  router.get("/resumenTemporada",[authJwt.verifyToken],matchevent.resumenTemporada)
  router.get("/resumenTemporadaPorFallos",[authJwt.verifyToken],matchevent.resumenTemporadaPorFallos)
  router.get("/resumenTemporadaPorPartido",[authJwt.verifyToken],matchevent.resumenTemporadaPorPartido)
  router.get("/clasificacion",matchevent.getOldestUserIdForTeam)

  app.use('/api', router);
};
