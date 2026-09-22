const controller = require("../controllers/surveys.controller");
const { authJwt } = require("../middleware");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept, Authorization"
    );
    next();
  });

  // --- Rutas de Jugadora Autenticada ---
  app.get("/api/surveys/my-surveys", [authJwt.verifyToken], controller.getMySurveys);
  app.get("/api/surveys/:id/form", [authJwt.verifyToken], controller.getSurveyForm);
  app.post("/api/surveys/:id/draft", [authJwt.verifyToken], controller.saveDraft);
  app.post("/api/surveys/:id/submit", [authJwt.verifyToken], controller.submitResponse);
  app.get("/api/surveys/:id/player-results", [authJwt.verifyToken], controller.getPlayerResults);

  // --- Rutas de Administración / Entrenador ---
  app.get(
    "/api/surveys/team/:teamId",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.getTeamSurveys
  );

  app.post(
    "/api/surveys/instantiate-template",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.instantiateInitialTemplate
  );

  app.post(
    "/api/surveys",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.createSurvey
  );

  app.put(
    "/api/surveys/:id",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.updateSurvey
  );

  app.put(
    "/api/surveys/:id/status",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.updateSurveyStatus
  );

  app.get(
    "/api/surveys/:id/admin-details",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.getSurveyAdminDetails
  );

  app.put(
    "/api/surveys/:id/reopen/:playerId",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.reopenResponse
  );

  app.get(
    "/api/surveys/:id/export/excel",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.exportExcel
  );

  app.get(
    "/api/surveys/:id/export/csv",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.exportCsv
  );
};
