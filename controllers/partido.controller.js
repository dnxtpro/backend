const db = require("../model");
const Partido = db.partido;
const { verifyToken } = require("../middleware/authJwt");
const partidoModel = require("../model/partido.model");

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
exports.createMatch = async (req,res) =>{
  const {rivalTeam,date,location }= req.body;
  const userId = req.userId;
  const partido={
    equipo_local:"Roche",rivalTeam,date,location,userId
  }
  try{
    const createdPartido = await Partido.create(partido);
    res.status(201).json(createdPartido);
  }
  catch (error)
  {
    console.error("Error al agregar jugador:", error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

