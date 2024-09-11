const { authJwt } = require("../middleware");
const { verifyToken } = require("../middleware/authJwt.js");


module.exports = app => {
  const matchevent = require("../controllers/matchevents.controller.js");

  var router = require("express").Router();

  router.post("/matchevent/user",[verifyToken, authJwt.isAdmin],matchevent.createEvent);
  router.get("/matchevent/:matchId",matchevent.getEventDetails);
router.get("/lastevents/:matchId",matchevent.ultimoseventos);
router.get("/resumen/jugador/:matchId",matchevent.resumenJugador);
  app.use('/api', router);
};
