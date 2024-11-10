const db = require("../model");
const Partido = db.partido;
const { verifyToken } = require("../middleware/authJwt");
const partidoModel = require("../model/partido.model");

 
exports.findByUser = async (req, res) => {
  try {
    // Get the userId from the JWT token
    const userId = req.userId;

    // Step 1: Get all teams associated with the given userId
    const userTeams = await db.equipo.findAll({
      include: [{
        model: db.user,
        as: 'users',  // alias for user association in db.equipo
        where: { id: userId },
        attributes: []  // no need to retrieve user data here
      }],
      attributes: ['id']  // only need team IDs
    });

    // Extract team IDs from userTeams
    const teamIds = userTeams.map(team => team.id);

    // Step 2: Get all user IDs associated with these teams
    const usersInTeams = await db.user.findAll({
      include: [{
        model: db.equipo,
        as: 'teams',  // alias for team association in db.user
        where: { id: teamIds },
        attributes: []  // no need to retrieve team data here
      }],
      attributes: ['id']  // only need user IDs
    });

    // Extract user IDs from usersInTeams
    const userIds = usersInTeams.map(user => user.id);

    // Step 3: Find all matches (partidos) with these userIds
    const partidos = await db.partido.findAll({
      where: {
        userId: userIds  // Use Sequelize IN condition to filter by userIds
      },
      include: [{
        model: db.equipo,
        as: 'parequi',  // Alias for equipo model in partido association
        attributes: ['nombre']  // Only include the 'nombre' field
      }]
    });

    if (!partidos || partidos.length === 0) {
      return res.status(404).send({ message: "No matches found for this user or related teams." });
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