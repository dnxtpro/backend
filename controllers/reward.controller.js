const db = require("../model");
const reward = db.reward;
const pointslog = db.pointslog;
const rewardlog = db.rewardlog;
const { QueryTypes } = require('sequelize');
const sequelize = db.sequelize;


exports.createPointsLog = async (req, res) => {
  const points = req.body.points;
  const reason = req.body.reason;
  const userId = req.userId;

  if (!userId || !points || !reason) {
    console.log("mondongo",points,reason,req.body)
    return res.status(400).send({
     
      message: "Content can not be empty!", userId, points, reason
    });
  }

  try {
    const newPointsLog = await pointslog.create({
      userId: userId,
      points: points,
      reason: reason
    });

    res.status(201).send(newPointsLog);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while creating the PointsLog."
    });
  }
};

exports.getPointsLog = async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).send({
      message: "User ID can not be empty!"
    });
  }

  try {
    const pointsLogs = await pointslog.findAll({
      where: { userId: userId }
    });

    const totalPoints = pointsLogs.reduce((acc, log) => acc + log.points, 0);

    res.status(200).send({
      pointsLogs: pointsLogs,
      totalPoints: totalPoints
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving the PointsLog."
    });
  }
};
exports.getRewards = async (req, res) => {
  try {
    const rewards = await reward.findAll();

    res.status(200).send(rewards);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving the rewards."
    });
  }
};

exports.redeemReward = async (req, res) => {
  const rewardId  = req.body.rewardId;
  const userId = req.userId;

  // Verifica que userId y rewardId no estén vacíos
  if (!userId || !rewardId) {
    return res.status(400).send({
      message: "User ID y Reward ID no pueden estar vacíos!"
    });
  }

  try {
    // Busca la recompensa en la base de datos
    const rewardItem = await reward.findOne({ where: { id: rewardId } });

    // Si la recompensa no existe, devuelve un error
    if (!rewardItem) {
      return res.status(404).send({
        message: "Recompensa no encontrada!"
      });
    }

    // Obtiene todos los registros de puntos del usuario
    const pointsLogs = await pointslog.findAll({
      where: { userId: userId }
    });

    // Calcula el total de puntos del usuario
    const totalPoints = pointsLogs.reduce((acc, log) => acc + log.points, 0);

    // Verifica si el usuario tiene suficientes puntos para canjear la recompensa
    if (totalPoints < rewardItem.pointsRequired) {
      return res.status(400).send({
        message: "No tienes suficientes puntos para canjear esta recompensa!"
      });
    }

    // Calcula los puntos restantes después de canjear la recompensa
    const remainingPoints = totalPoints - rewardItem.pointsRequired;

    // Crea un nuevo registro en pointslog restando los puntos gastados
    await pointslog.create({
      userId: userId,
      points: -rewardItem.pointsRequired,
      reason: `Recompensa canjeada: ${rewardItem.name}`
    });

    // Crea un nuevo registro en rewardlog con la información del canje
    await rewardlog.create({
      userId: userId,
      rewardId: rewardId,
      pointsSpent: rewardItem.pointsRequired
    });

    // Responde con un mensaje de éxito y los puntos restantes
    res.status(200).send({
      message: "Recompensa canjeada exitosamente!",
      remainingPoints: remainingPoints
    });
  } catch (error) {
    // Responde con un mensaje de error en caso de fallo
    res.status(500).send({
      message: error.message || "Ocurrió un error al canjear la recompensa."
    });
  }
};