
const express = require('express');
const router = express.Router();
const Player = require('../models/player');

// Ruta para obtener todos los jugadores
router.get('/positions', (req, res) => {
  Player.getAllPositions((error, positions) => {
    if (error) {
      console.error("Error al obtener posiciones:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(positions);
    }
  });
});
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
