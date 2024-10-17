const db = require("../model");
const playersModel = db.players;
const { verifyToken } = require("../middleware/authJwt");

exports.findPlayers = async (req, res) => {
  try {
    // Obtener el userId del token JWT si es necesario
    const userId = req.userId;
    console.log('hola',req.userId)

    // Buscar todos los jugadores
    const allPlayers = await playersModel.findAll({
        where: {
            userId: userId // Filter by userId
        },
      include: [{
        model: db.positions, // Incluir el modelo de posiciones
        as: 'position', // Nombre del alias definido en el modelo
        attributes: ['position_name'] // Incluir solo el campo 'position_name'
      },
    {
        model:db.equipo,
        as: 'equipo',
        attributes:['nombre']
    },
    {
      model: db.user, // Incluir el modelo de usuarios
      as: 'ser', // Nombre del alias definido en el modelo
      attributes: ['username'] // Incluir solo el campo 'name' de mainUser
    }],
    order: [['dorsal', 'ASC']]
    });

    const transformedPlayers = allPlayers.map(player => {
        const playerData = player.toJSON(); // Convertir el modelo a un objeto JSON
        return {
          player_id: playerData.player_id,
          name: playerData.player_name, // Renombrar 'player_name' a 'name'
          dorsal: playerData.dorsal,
          positionId: playerData.position_id,
          position_name: playerData.position.position_name,
          nombre_equipo: playerData.equipo.nombre,
          mainUser: playerData.ser ? playerData.ser.username : null
        };
      });

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
  
