const pool = require('../config/db');
const FaultType = require('./faultType');

const Player = {
  
  getPlayerWithPosition: async (playerId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT players.*, positions.position_name AS position_name
        FROM players
        LEFT JOIN positions ON players.position_Id = positions.position_id
        WHERE players.id = ?
      `;

      pool.query(query, [playerId], (error, results) => {
        if (error) {
          console.error("Error en getPlayerWithPosition:", error);
          reject(error);
        } else {
          resolve(results[0]);
        }
      });
    });
  },
  getAllPlayers: (callback) => {
    // Modifica la consulta SQL para incluir la información de la posición
    const query = `
      SELECT players.*, positions.position_name AS position_name
      FROM players
      LEFT JOIN positions ON players.position_Id = positions.position_id
      order by dorsal
    `;

    pool.query(query, (error, results) => {
      if (error) {
        console.error("Error en getAllPlayers:", error);
        callback(error, null);
      } else {
 console.log("Resultados de la consulta getAllPlayers:", results);
        callback(null, results);
      }
    });
  },


  getAllPositions: (callback) => {
    const query = 'SELECT * FROM positions';

    pool.query(query, (error, results) => {
      if (error) {
        console.error("Error en getAllPositions:", error);
        callback(error, null);
      } else {
        callback(null, results);
      }
    });
  },
create: (newPlayer, callback) => {
  pool.query('INSERT INTO players SET ?', {
    player_name: newPlayer.name,
    position_Id: newPlayer.positionId,
    dorsal: newPlayer.dorsal,
  }, (error, results) => {
    if (error) {
      console.error("Error en addPlayer:", error);
      return callback(error, null);
    } else {
      // Obtén la información completa del jugador recién insertado
      const playerId = results.insertId;
      pool.query('SELECT * FROM players WHERE player_id = ?', [playerId], (error, playerInfo) => {
        if (error) {
          console.error("Error al obtener información del jugador:", error);
          return callback(error, null);
        } else {
          const player = playerInfo[0];
          
          // Ahora, consulta el position_name en la tabla positions
          pool.query('SELECT position_name FROM positions WHERE position_id = ?', [player.position_id], (error, positionInfo) => {
            if (error) {
              console.error("Error al obtener información de la posición:", error);
              return callback(error, null);
            } else {
              // Agrega el position_name al objeto del jugador
              player.position_name = positionInfo[0].position_name;
              return callback(null, player);
            }
          });
        }
      });
    }
  });
},

getFaultTypes: FaultType.getFaultTypes,
};
module.exports = Player;