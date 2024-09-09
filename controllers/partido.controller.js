const db = require("../model");
const Partido = db.partido;
const { verifyToken } = require("../middleware/authJwt");

exports.findByUser = async (req, res) => {
  try {
    // Obtener el userId del token JWT
    const userId = req.userId;

    const partidos = await Partido.findAll({
      where: {
        userId: userId
      }
    });

    if (!partidos) {
      return res.status(404).send({ message: "No matches found for this user." });
    }

    res.status(200).send(partidos);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving matches."
    });
  }
};

