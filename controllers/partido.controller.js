const db = require("../model");
const Partido = db.partido;
const { verifyToken } = require("../middleware/authJwt");
const partidoModel = require("../model/partido.model");

 
exports.findByUser = async (req, res) => {
  try {
    const userId = req.userId;

    // Obtener el usuario
    const user = await db.user.findByPk(userId);

    // Usar el método `getUseras` para obtener los equipos asociados
    const equipos = await user.getUseras({
      attributes: ['id'] // Solo obtener los IDs
    });

    if (!equipos || equipos.length === 0) {
      return res.status(404).send({ message: "No se encontraron equipos asociados a este usuario." });
    }

    const teamIds = equipos.map(equipo => equipo.id);

    // Buscar los partidos con esos equipos
    const partidos = await db.partido.findAll({
      where: {
        equipoId: teamIds
      },
      include: [{
        model: db.equipo,
        as: 'parequi', // Alias definido en la relación partido -> equipo
        attributes: ['nombre']
      }]
    });

    if (!partidos || partidos.length === 0) {
      return res.status(404).send({ message: "No se encontraron partidos para los equipos asociados a este usuario." });
    }

    res.status(200).send(partidos);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: err.message || "Ocurrió un error al recuperar los partidos."
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