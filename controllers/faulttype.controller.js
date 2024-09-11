const db = require("../model");
const faulttypemodel = db.faulttype;
const { verifyToken } = require("../middleware/authJwt");

exports.findFaulttypes = async (req, res) => {
  try {
    // Obtener el userId del token JWT si es necesario
    // const userId = req.userId;

    // Buscar todos los jugadores
    const FaultTypes = await faulttypemodel.findAll({
      // Puedes incluir otras opciones aquí si es necesario
    });

    if (FaultTypes.length === 0) {
      return res.status(404).send({ message: "No faults found" });
    }

    res.status(200).send(FaultTypes);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving faults."
    });
  }
};
