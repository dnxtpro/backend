module.exports = app => {
  const anotaciones = require('../controllers/anotaciones.controller.js');
  const authJwt = require('../middleware/authJwt.js');
  var router = require('express').Router();

  // Create a new anotacion (user must be authenticated)
  router.post('/anotaciones', [authJwt.verifyToken,authJwt.isModeratorOrAdmin], anotaciones.create);
    
  // Retrieve all anotaciones (moderator or admin)
  router.get('/anotaciones', [authJwt.verifyToken, authJwt.isModeratorOrAdmin], anotaciones.findAll);

  // Retrieve anotaciones by matchId (authenticated users)
  router.get('/anotaciones/match/:matchId', [authJwt.verifyToken], anotaciones.findByMatch);

  // Retrieve a single anotacion by id (authenticated users)
  router.get('/anotaciones/:id', [authJwt.verifyToken], anotaciones.findOne);

  // Update an anotacion (moderator or admin)
  router.put('/anotaciones/:id', [authJwt.verifyToken, authJwt.isModeratorOrAdmin], anotaciones.update);

  // Delete an anotacion (moderator or admin)
  router.delete('/anotaciones/:id', [authJwt.verifyToken, authJwt.isModeratorOrAdmin], anotaciones.delete);

  // Delete all anotaciones (moderator or admin)
  router.delete('/anotaciones', [authJwt.verifyToken, authJwt.isModeratorOrAdmin], anotaciones.deleteAll);

  app.use('/api', router);
};

