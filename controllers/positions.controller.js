const db = require("../model");
const positionModel = db.positions;
const { verifyToken } = require("../middleware/authJwt");

exports.findPositions = async (req, res, next) => {
  try {
    // Obtener el userId del token JWT si es necesario
    // const userId = req.userId;

    // Buscar todos los jugadores
    const allPositions = await positionModel.findAll({
      // Puedes incluir otras opciones aquí si es necesario
    });

    if (allPositions.length === 0) {
      return res.status(404).send({ message: "No players found" });
    }

    res.status(200).send(allPositions);
  } catch (err) {
    next(err);
  }
};
exports.positions = async (req, res, next)=>{
  return res.status(404).send({ message: "No players found" });
}
