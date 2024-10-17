const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");
const playersController= require("../controllers/players.controller")

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/test/all", controller.allAccess);

  app.get(
    "/api/test/user",
    [authJwt.verifyToken],
    controller.userBoard
  );

  app.get(
    "/api/test/mod",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorBoard
  );

  app.get(
    "/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );
  app.get("/api/users/getAll",[authJwt.verifyToken,authJwt.getUserRole],controller.getUsers);
  app.put('/api/users/assignUserToPlayer', [authJwt.verifyToken,authJwt.isModeratorOrAdmin], playersController.assignUserToPlayer);
app.put('/api/users/updaterole/:userId',[authJwt.verifyToken,authJwt.isAdmin],controller.updateUserRoles)
};