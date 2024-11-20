const db = require("../model");
const playersModel = db.players;
const { verifyToken } = require("../middleware/authJwt");

exports.findPlayers = async (req, res) => {
  try {
    // Obtener el userId del token JWT si es necesario
    const userId = req.userId;

    // Step 1: Find all teams associated with this user
    const userTeams = await db.equipo.findAll({
      include: [{
        model: db.user,
        as: 'equipa',  // Correct alias for the user-equipo relationship
        where: { id: userId },  // Filter for the logged-in user
        attributes: []  // No need to retrieve user attributes here
      }],
      attributes: ['id']  // Only retrieve team IDs
    });

    if (userTeams.length === 0) {
      return res.status(404).send({ message: "No teams found for this user." });
    }

    // Extract team IDs
    const teamIds = userTeams.map(team => team.id);

    // Step 2: Find all users in these teams
    const usersInTeams = await db.user.findAll({
      include: [{
        model: db.equipo,
        as: 'useras',  // Correct alias for equipo-user relationship
        where: { id: teamIds },
        attributes: []
      }],
      attributes: ['id']  // Only need user IDs
    });

    // Extract user IDs
    const userIds = usersInTeams.map(user => user.id);

    // Step 3: Find all players associated with these userIds
    const allPlayers = await db.players.findAll({
      where: {
        userId: userIds  // Filter players by userIds
      },
      include: [
        {
          model: db.positions,
          as: 'position',
          attributes: ['position_name']  // Include only the position name
        },
        {
          model: db.equipo,
          as: 'equipo',
          attributes: ['nombre']  // Include the team name
        },
        {
          model: db.user,
          as: 'ser',  // Correct alias for the user associated with the player
          attributes: ['username']  // Include the username
        }
      ],
      order: [['dorsal', 'ASC']]  // Order by dorsal
    });

    // Transform player data
    const transformedPlayers = allPlayers.map(player => {
      const playerData = player.toJSON();  // Convert model to plain JSON
      return {
        player_id: playerData.player_id,
        name: playerData.player_name,  // Rename player_name to name
        dorsal: playerData.dorsal,
        positionId: playerData.position_id,
        position_name: playerData.position.position_name,
        nombre_equipo: playerData.equipo.nombre,
        mainUser: playerData.ser ? playerData.ser.username : null
      };
    });

    // Check if no players were found
    if (transformedPlayers.length === 0) {
      return res.status(404).send({ message: "No players found" });
    }

    // Send the transformed players in the response
    res.status(200).send(transformedPlayers);

  } catch (err) {
    console.error("Error in findPlayers:", err);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving players."
    });
  }
};
exports.findTeamPlayers = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.userId;

    // Step 1: Find all teams associated with this user
    const userTeams = await db.equipo.findAll({
      include: [{
        model: db.user,
        as: 'equipa',  // Correct alias for the user-equipo relationship
        where: { id: userId },  // Filter for the logged-in user
        attributes: []  // No need to retrieve user attributes here
      }],
      attributes: ['id']  // Only retrieve team IDs
    });

    if (userTeams.length === 0) {
      return res.status(404).send({ message: "No teams found for this user." });
    }

    // Extract team IDs
    const teamIds = userTeams.map(team => team.id);

    // Step 2: Find all users in these teams
    const usersInTeams = await db.user.findAll({
      include: [{
        model: db.equipo,
        as: 'useras',  // Correct alias for equipo-user relationship
        where: { id: teamIds },
        attributes: []
      }],
      attributes: ['id']  // Only need user IDs
    });

    // Extract user IDs
    const userIds = usersInTeams.map(user => user.id);

    // Step 3: Find all players associated with these userIds
    const allPlayers = await db.players.findAll({
      where: {
        equipoId:teamId  // Filter players by userIds
      },
      include: [
        {
          model: db.positions,
          as: 'position',
          attributes: ['position_name']  // Include only the position name
        },
        {
          model: db.equipo,
          as: 'equipo',
          attributes: ['nombre']  // Include the team name
        },
        {
          model: db.user,
          as: 'ser',  // Correct alias for the user associated with the player
          attributes: ['username']  // Include the username
        }
      ],
      order: [['dorsal', 'ASC']]  // Order by dorsal
    });

    // Transform player data
    const transformedPlayers = allPlayers.map(player => {
      const playerData = player.toJSON();  // Convert model to plain JSON
      return {
        player_id: playerData.player_id,
        name: playerData.player_name,  // Rename player_name to name
        dorsal: playerData.dorsal,
        positionId: playerData.position_id,
        position_name: playerData.position.position_name,
        nombre_equipo: playerData.equipo.nombre,
        mainUser: playerData.ser ? playerData.ser.username : null
      };
    });

    // Check if no players were found
    if (transformedPlayers.length === 0) {
      return res.status(404).send({ message: "No players found" });
    }

    // Send the transformed players in the response
    res.status(200).send(transformedPlayers);

  } catch (err) {
    console.error("Error in findPlayers:", err);
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
      
  
      const teamId = player.equipoId; // Asegúrate de que `equipoId` sea el nombre de la columna en `playersModel`
      if (!teamId) {
        return res.status(404).send({ message: "Player is not associated with any team." });
      }
  
      // Buscar el equipo
      const team = await db.equipo.findByPk(teamId);
      if (!team) {
        return res.status(404).send({ message: "Team not found for the player." });
      }
  
      // Asociar el usuario al equipo usando la relación belongsToMany
      await team.setEquipa(userId); // Usa el método basado en tu alias definido en `db.equipo.belongsToMany`
  
      res.status(200).send({ 
        message: `User ${userId} has been assigned to player ${playerId} and associated with team ${teamId}.` 
      });
    } catch (error) {
      console.error("Error al asignar usuario al jugador:", error);
      res.status(500).send({ message: 'Internal Server Error' });
    }
  };
  
