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
      },
      include: [{
        model: db.equipo, // Incluir el modelo de posiciones
        as: 'parequi', // Nombre del alias definido en el modelo
        attributes: ['nombre'] // Incluir solo el campo 'position_name'
      },]
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
  console.log(req.body)
  const {rivalTeam,date,location,equipoId }= req.body;
  const userId = req.userId;
  const partido={
    equipo_local:"Roche",rivalTeam,date,location,userId,equipoId
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

exports.detallesUltimos = async (req, res) => {
  try {
    const userId = req.userId;

    // Obtener el último partido del usuario
    const partido = await Partido.findOne({
      where: {
        userId: userId
      },
      order: [['id', 'DESC']]
    });

    if (!partido) {
      return res.status(404).json({ message: "No hay detalles" });
    }

    // Obtener el equipo relacionado por equipoId usando findByPk
    const equipo = await db.equipo.findByPk(partido.equipoId, {
      attributes: ['nombre'] // Selecciona solo el nombre del equipo
    });

    if (!equipo) {
      return res.status(404).json({ message: "No se encontró el equipo relacionado" });
    }

    // Devolver el resultado con los datos del partido y el nombre del equipo
    const result = {
      ...partido.toJSON(),  // Convierte el objeto partido a JSON
      equipoNombre: equipo.nombre  // Añade el nombre del equipo
    };

    res.status(200).json(result);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Problema interno" });
  
  }
};