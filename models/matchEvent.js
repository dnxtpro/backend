const pool = require('../config/db');

const MatchEvent = {
  create: (matchEventData, callback) => {
    const {
      eventId,
      matchId,
      eventType,
      actionType,
      playerId,
      scoreLocal,
      scoreVisitor,
      setsLocal,
      setsVisitor,
      timestamp
    } = matchEventData;

    // Asegúrate de que los nombres de las columnas en la base de datos coincidan con los nombres que estás utilizando aquí
    const sql = ` 
      INSERT INTO matchevents
      (eventId, matchId, eventType, actionType, playerId, scoreLocal, scoreVisitor, setsLocal, setsVisitor, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      eventId,
      matchId,
      eventType,
      actionType,
      playerId,
      scoreLocal,
      scoreVisitor,
      setsLocal,
      setsVisitor,
      timestamp
    ];

    pool.query(sql, values, (error, results) => {
      if (error) {
        console.error("Error al crear evento del partido:", error);
        return callback(error, null);
      }

      console.log('Evento del partido creado con éxito:', results);
      return callback(null, results);
    });
  },
  getLatest: (callback) => {
    const sql = `
      SELECT *
      FROM matchevents
      ORDER BY timestamp DESC
      LIMIT 1;  
    `;

    pool.query(sql, (error, results) => {
      if (error) {
        console.error("Error al obtener los últimos datos del partido:", error);
        return callback(error, null);
      }

      if (results.length === 0) {
        console.log("No se encontraron datos de eventos del partido");
        return callback(null, null);
      }

      const latestData = results[0];
      console.log("Últimos datos del partido recuperados con éxito:", latestData);
      return callback(null, latestData);
    });
  },
  deleteLastEvent: (matchId, callback) => {
    const sql = `
      DELETE FROM matchevents
      WHERE matchId = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    pool.query(sql, [matchId], (error, result) => {
      if (error) {
        console.error("Error al borrar el último evento del partido:", error);
        return callback(error, null);
      }

      console.log("Último evento del partido borrado con éxito:", result);
      return callback(null, result);
    });
  },
  ultimoseventos:(matchId,callback) =>{
    console.log('llamada recibida')
    const sql=`
    select me.id, me.matchId ,me.playerId, me.scoreLocal,me.scoreVisitor, f.type ,p.player_name,p.dorsal FROM matchevents me 

INNER JOIN faulttypes f
ON me.eventId = f.id
INNER JOIN players p ON me.playerId = p.player_id
WHERE me.matchId = ?
ORDER by me.id DESC
LIMIT 15;
    `;
    pool.query(sql, [matchId], (error, results) => {
      if (error) {
        console.error("Error al obtener eventos del partido:", error);
        return callback(error, null);
      }
    
      console.log("Eventos del partido recuperados con éxito:", results);
      return callback(null, results);
    });
  },
  getByMatchId: (matchId, callback) => {
    const sql = `
    SELECT
    p.player_name,
    t.total_sets,
    me.eventId,
    ft.type,
    COUNT(me.eventId) AS event_count
FROM players p
CROSS JOIN (
    SELECT DISTINCT setsLocal + setsVisitor + 1 AS total_sets
    FROM matchevents
    WHERE matchId = 72
) AS t
LEFT JOIN matchevents me ON p.player_id = me.playerId AND (me.setsLocal + me.setsVisitor + 1) = t.total_sets AND me.matchId = 72
LEFT JOIN faulttypes ft ON me.eventId = ft.id
WHERE me.matchId = 72
GROUP BY p.player_name, t.total_sets, me.eventId, ft.type
ORDER BY p.player_name, t.total_sets, me.eventId;


    `;

    pool.query(sql, [matchId], (error, results) => {
      if (error) {
        console.error("Error al obtener eventos del partido:", error);
        return callback(error, null);
      }
    
      console.log("Eventos del partido recuperados con éxito:", results);
      return callback(null, results);
    });
},
};

module.exports = MatchEvent;
