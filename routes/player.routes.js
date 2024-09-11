const playersController = require("../controllers/players.controller.js");
const { authJwt } = require("../middleware");
module.exports = function(app){
  
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  // Ruta para obtener todos los jugadores
  app.get("/api/players/all",[verifyToken,authJwt.isModeratorOrAdmin], playersController.findPlayers); // Solo la función de controlador, sin middleware
  app.post('/api/players/all', verifyToken, playersController.createPlayer);
 
};
