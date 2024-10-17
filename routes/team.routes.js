
const controller = require("../controllers/equipo.controller");
const { authJwt } = require("../middleware");
module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/team",[authJwt.verifyToken,authJwt.isModeratorOrAdmin],
    controller.equipo
  );
  app.get("/api/getTeams",[authJwt.verifyToken],controller.obtenerEquipo)
  app.get("/api/getTeams1",controller.obtenerEquipos)
};