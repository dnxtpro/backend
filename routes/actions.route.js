const controller = require('../controllers/actions.controller');
const authJwt = require('../middleware/authJwt.js');
module.exports = app => {
  const router = require('express').Router();

  // GET /api/actions -> returns actionRatings and actionTypes
  router.get('/actions', controller.get);
  // POST /api/actions -> create a new action register entry
  router.post('/actions',[authJwt.verifyToken,authJwt.isModeratorOrAdmin], controller.post);
  // Action-specific summaries per match
  router.get('/actions/saque/:matchId', controller.getSaques);
  router.get('/actions/rece/:matchId', controller.getReces);
  router.get('/actions/ataque/:matchId', controller.getAtaques);
  router.get('/actions/colocaciones/:matchId', controller.getColocaciones);

  app.use('/api', router);
};
