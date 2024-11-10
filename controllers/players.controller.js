const db = require("../model");
const playersModel = db.players;
const { verifyToken } = require("../middleware/authJwt");

exports.findPlayers = async (req, res) => {
  try {
    // Obtain the userId from the JWT token if necessary
    const userId = req.userId;

    // Step 1: Find all teams associated with this user
    const userTeams = await db.equipo.findAll({
      include: [{
        model: db.user,
        as: 'users',  // Use the alias defined in the model
        where: { id: userId },
        attributes: []  // No need to retrieve additional user data here
      }],
      attributes: ['id']  // Only retrieve the team ID
    });

    // Extract team IDs
    const teamIds = userTeams.map(team => team.id);

    // Step 2: Get all user IDs associated with these teams
    const usersInTeams = await db.user.findAll({
      include: [{
        model: db.equipo,
        as: 'users',  // Ensure alias matches the model definition
        where: { id: teamIds },
        attributes: []
      }],
      attributes: ['id']  // Only need the user IDs
    });

    // Extract user IDs
    const userIds = usersInTeams.map(user => user.id);

    // Step 3: Find all players whose `userId`s match those in the team
    const allPlayers = await playersModel.findAll({
      where: {
        userId: userIds  // Filter players by matching `userId`s
      },
      include: [
        {
          model: db.positions,
          as: 'position',
          attributes: ['position_name']
        },
        {
          model: db.equipo,
          as: 'equipo',
          attributes: ['nombre']
        },
        {
          model: db.user,
          as: 'ser',
          attributes: ['username']
        }
      ],
      order: [['dorsal', 'ASC']]
    });

    // Transform player data
    const transformedPlayers = allPlayers.map(player => {
      const playerData = player.toJSON();
      return {
        player_id: playerData.player_id,
        name: playerData.player_name,
        dorsal: playerData.dorsal,
        positionId: playerData.position_id,
        position_name: playerData.position.position_name,
        nombre_equipo: playerData.equipo.nombre,
        mainUser: playerData.ser ? playerData.ser.username : null
      };
    });

    // Return result or no players found
    if (transformedPlayers.length === 0) {
      return res.status(404).send({ message: "No players found" });
    }

    res.status(200).send(transformedPlayers);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving players."
    });
  }
};

exports.createPlayer = async (req, res) => {
    console.log('Solicitud para crear jugador recibida',req.body);
    const { name, positionId, dorsal,equipoId } = req.body;
    const userId = req.userId;
    const newPlayer = {
        player_name: name, // Mapear 'name' a 'player_name'
        position_id: positionId, // Mapear 'positionId' a 'position_id'
        dorsal,
        userId ,
        equipoId // Asegúrate de que 'dorsal' está presente en el cuerpo de la solicitud
      };
  
    try {
      // Crear un nuevo jugador en la base de datos usando Sequelize
      const createdPlayer = await playersModel.create(newPlayer);
  
      // Enviar la respuesta con el jugador creado
      res.status(201).json(createdPlayer);
    } catch (error) {
      console.error("Error al agregar jugador:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
 exports.assignUserToPlayer = async (req, res) => {
  console.log('assignUsetToPLayer')
    try {
      const { userId, playerId } = req.body;
      console.log(userId,playerId)
  
      // Verificar que se proporcionaron ambos IDs
      if (!userId || !playerId) {
        return res.status(400).send({ message: "Both userId and playerId are required." });
      }
  
      // Buscar el jugador por playerId
      const player = await playersModel.findByPk(playerId);
  
      if (!player) {
        return res.status(404).send({ message: "Player not found" });
      }
  
      // Actualizar la columna mainUser del jugador
      await player.update({ mainUser: userId });
  
      res.status(200).send({ message: `User ${userId} has been assigned to player ${playerId}` });
    } catch (error) {
      console.error("Error al asignar usuario al jugador:", error);
      res.status(500).send({ message: 'Internal Server Error' });
    }
  };
  
