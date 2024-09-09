const db = require("../model");
const playersModel = db.players;
const { verifyToken } = require("../middleware/authJwt");

exports.findPlayers = async (req, res) => {
  try {
    // Obtener el userId del token JWT si es necesario
    const userId = req.userId;

    // Buscar todos los jugadores
    const allPlayers = await playersModel.findAll({
        where: {
            userId: userId // Filter by userId
        },
      include: [{
        model: db.positions, // Incluir el modelo de posiciones
        as: 'position', // Nombre del alias definido en el modelo
        attributes: ['position_name'] // Incluir solo el campo 'position_name'
      }]
    });

    const transformedPlayers = allPlayers.map(player => {
        const playerData = player.toJSON(); // Convertir el modelo a un objeto JSON
        return {
          player_id: playerData.player_id,
          name: playerData.player_name, // Renombrar 'player_name' a 'name'
          dorsal: playerData.dorsal,
          positionId: playerData.position_id,
          position_name: playerData.position.position_name
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
    const { name, positionId, dorsal } = req.body;
    const userId = req.userId;
    const newPlayer = {
        player_name: name, // Mapear 'name' a 'player_name'
        position_id: positionId, // Mapear 'positionId' a 'position_id'
        dorsal,
        userId  // Asegúrate de que 'dorsal' está presente en el cuerpo de la solicitud
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
  
