const controller = require("../controllers/roster.controller");
const { authJwt } = require("../middleware");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept, Authorization"
    );
    next();
  });

  // --- Rutas Públicas (Enlace Único de Activación y Recuperación) ---
  app.get("/api/roster/token-info/:token", controller.getTokenInfo);
  app.post("/api/roster/activate", controller.activateAccount);
  app.post("/api/roster/reset-password", controller.resetPassword);

  // --- Rutas de Jugadora Autenticada ---
  app.get("/api/roster/my-profile", [authJwt.verifyToken], controller.getMyProfile);
  app.put("/api/roster/my-profile", [authJwt.verifyToken], controller.updateMyProfile);

  // --- Rutas de Administración / Entrenador ---
  app.post(
    "/api/roster/preselect",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.preselectPlayer
  );

  app.post(
    "/api/roster/preselect-initial",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.preselectInitialRoster
  );

  app.put(
    "/api/roster/player/:playerId",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.updatePlayer
  );

  app.post(
    "/api/roster/generate-invitation",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.generateInvitation
  );

  app.post(
    "/api/roster/generate-recovery",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.generateRecovery
  );

  app.post(
    "/api/roster/revoke-token",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.revokeToken
  );
};
