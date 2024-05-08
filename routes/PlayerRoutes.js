
const express = require('express');
const router = express.Router();
const Player = require('../models/player');
const mysql = require('mysql2');
const pool = require('../config/db');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'dnxtpro',
  password: 'locoplaya',
  database: 'appstats'
});


async function updatePlayerPositions(positions) {
  try {
    // Define la consulta SQL
    const sql = `UPDATE posiciones SET posiciones.idJugadores = ? WHERE posiciones.id = ?`;

    // Ejecuta la actualización para cada posición
    for (const position of positions) {
      // Abre una nueva conexión para cada consulta
      const connection = mysql.createConnection({
        host: 'localhost',
        user: 'dnxtpro',
        password: 'locoplaya',
        database: 'appstats'
      });
      connection.connect();

      await new Promise((resolve, reject) => {
        // Ejecuta la consulta SQL con los parámetros correspondientes
        connection.query(sql, [position.player_id, position.position], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });

      // Cierra la conexión después de cada consulta
      connection.end();
    }

    console.log('Player positions updated successfully!');
    return { message: 'Player positions updated successfully' };
  } catch (error) {
    console.error('Error updating player positions:', error);
    return { error: 'Internal Server Error' };
  }
}



router.patch('/positions1', async (req, res) => {
  const positions = req.body; // Suponiendo que el cuerpo de la solicitud contiene un array de posiciones
  console.log(req.body);
  try {
    const updateResult = await updatePlayerPositions(positions);
    res.json(updateResult);
  } catch (error) {
    console.error('Error handling update request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/positions2',(req,res)=>{
  const query = 'SELECT posiciones.id AS posiciones, players.dorsal, players.player_id FROM appstats.posiciones LEFT JOIN players ON posiciones.idJugadores = players.player_id;';
  pool.query(query, (error, results) => {
    if (error) {
      console.error("Error al obtener los detalles del partido más reciente:", error);
      res.status(500).json({ error: 'Error al obtener elmarcador' });
    } else {
      res.status(200).json(results);
      console.log('posiciones:',results)
    }
  });
})
router.get('/players', (req, res) => {
  console.log('Solicitud a /players recibida');
  Player.getAllPlayers((error, results) => {
    if (error) {
      console.error("Error al obtener jugadores:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      // Modifica la respuesta para incluir el nombre del jugador y el nombre de la posición
      const modifiedResults = results.map((player) => ({
        player_id: player.player_id,
        name: player.player_name,
        dorsal: player.dorsal,
        positionId: player.position_id,
        position_name: player.position_name
      }));
      res.json(modifiedResults);
    }
  });
});

// Ruta para agregar un nuevo jugador
router.post('/players', (req, res) => {
  console.log('Solicitud a /players recibida');
  const newPlayer = req.body;

  Player.create(newPlayer, (error, results) => {
    if (error) {
      console.error("Error al agregar jugador:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});
router.post('/players', async (req, res) => {
  console.log('Solicitud a /players recibida');
  const newPlayer = req.body;

  try {
    // Agrega el nuevo jugador
    const result = await Player.addPlayer(newPlayer);

    // Obtiene la información completa del jugador (incluyendo el nombre de la posición)
    const playerWithPosition = await Player.getPlayerWithPosition(result.insertId);

    res.status(201).json(playerWithPosition);
  } catch (error) {
    console.error("Error al agregar jugador:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});	


module.exports = router;
