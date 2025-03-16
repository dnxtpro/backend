const rewardController = require('../controllers/reward.controller');
const { verifyToken } = require('../middleware/authJwt');

module.exports = app => {
    var router = require('express').Router();

    // Define routes and map them to controller functions
  router.get('/pointslog',[verifyToken],rewardController.getPointsLog);
  router.post('/pointslog',[verifyToken],rewardController.createPointsLog);
  router.get('/rewards',[verifyToken],rewardController.getRewards);
  router.post('/rewards',[verifyToken],rewardController.redeemReward);

    app.use('/api', router);
};