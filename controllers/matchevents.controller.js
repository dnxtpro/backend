const db = require("../model");
const Match = db.matchevent;
const { QueryTypes } = require("sequelize");
const sequelize = db.sequelize;
const Equipo = db.equipo;
const User = db.user;

exports.createEvent = async (req, res) => {
  console.log("g1", req.body, "hl");
  const {
    matchId,
    actionType,
    playerId,
    scoreLocal,
    scoreVisitor,
    setsLocal,
    setsVisitor,
    eventId,
  } = req.body.matchEventData;
  const userId = req.userId;
  const event = {
    matchId,
    actionType,
    playerId,
    scoreLocal,
    scoreVisitor,
    setsLocal,
    setsVisitor,
    eventId,
    userId,
  };
  try {
    const createdEvent = await Match.create(event);
    res.status(201).json(createdEvent);
  } catch (error) {
    console.error("Error al agregar evento:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getEventDetails = async (req, res) => {
  const userId = req.userId;
  const matchId = parseInt(req.params.matchId, 10); // Obtener el ID del partido desde los parámetros de la solicitud
  console.log("hola", matchId);
  try {
    const [teamResult] = await sequelize.query(
      `
            SELECT teamId
            FROM user_teams
            WHERE userId = :userId
            LIMIT 1
        `,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );
    if (!teamResult) {
      return res.status(404).json({ error: "Team not found for user" });
    }
    console.log(teamResult);
    const teamId = teamResult.teamId;
    const matchIds = await sequelize.query(
      `
            SELECT id
            FROM datospartido
            WHERE equipoId = :teamId
        `,
      {
        replacements: { teamId },
        type: QueryTypes.SELECT,
      }
    );

    if (!matchIds.length) {
      return res.status(404).json({ error: "No matches found for team" });
    }
    const eventDetails = await sequelize.query(
      `
               SELECT
                p.player_name,
                p.dorsal,
                t.total_sets,
                me.eventId,
                ft.type,
                COUNT(me.eventId) AS event_count
            FROM players p
            CROSS JOIN (
                SELECT DISTINCT setsLocal + setsVisitor + 1 AS total_sets
                FROM matchevents
                WHERE matchId = :matchId
            ) AS t
            LEFT JOIN matchevents me ON p.player_id = me.playerId
                AND (me.setsLocal + me.setsVisitor + 1) = t.total_sets
                AND me.matchId = :matchId
            LEFT JOIN faulttypes ft ON me.eventId = ft.id
            WHERE me.matchId IN (:matchId)
            GROUP BY p.player_name, t.total_sets, me.eventId, ft.type
            ORDER BY p.player_name, t.total_sets, me.eventId;
        `,
      {
        replacements: { matchId, matchIds: matchIds.map((m) => m.id) }, // Sustituye :matchId por el valor del ID del partido
        type: QueryTypes.SELECT,
      }
    );

    res.status(200).json(eventDetails);
  } catch (error) {
    console.error("Error al obtener detalles del evento:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.resumenJugador = async (req, res) => {
  const matchId = parseInt(req.params.matchId, 10);
  const userId = req.userId;
  try {
    const resumen = await sequelize.query(
      `
            SELECT
                p.player_name,
                me.eventId,
                ft.type,
                ft.isSuccess,
                COUNT(me.eventId) AS event_count
            FROM players p
            LEFT JOIN matchevents me ON p.player_id = me.playerId 
                AND me.matchId = :matchId 
            LEFT JOIN faulttypes ft ON me.eventId = ft.id
            WHERE me.matchId = :matchId 
            GROUP BY p.player_name, me.eventId, ft.type
            ORDER BY p.player_name, me.eventId;
            `,
      {
        replacements: { matchId, userId },
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(resumen);
  } catch (error) {
    res.status(500).json({ error: "Error Interno de Servidor" });
  }
};
exports.ultimoseventos = async (req, res) => {
  const matchId = parseInt(req.params.matchId, 10);
  console.log("Llamada recibida", matchId);

  const sql = `
        SELECT 
            me.id, 
            me.matchId, 
            me.playerId, 
            me.scoreLocal, 
            me.scoreVisitor, 
            me.actionType, 
            f.type, 
            p.player_name, 
            p.dorsal 
        FROM matchevents me
        INNER JOIN faulttypes f ON me.eventId = f.id
        INNER JOIN players p ON me.playerId = p.player_id
        WHERE me.matchId = :matchId
        ORDER BY me.id DESC
        LIMIT 15;
    `;

  try {
    const results = await sequelize.query(sql, {
      replacements: { matchId }, // Sustituye `:matchId` por el valor de `matchId`
      type: QueryTypes.SELECT,
    });

    console.log("Eventos del partido recuperados con éxito:", results);
    const events = results;
    return res.json(events); // Devuelve los resultados directamente
  } catch (error) {
    console.error("Error al obtener eventos del partido:", error);
    throw error; // Lanza el error para que pueda ser manejado por la función que llame a `ultimoseventos`
  }
};

exports.obtenerUltimoevento = async (req, res) => {
  try {
    // Busca el último evento, ordenado por 'timestamp' de manera descendente, con un límite de 1
    const latestData = await Match.findAll({
      order: [["id", "DESC"]],
    });

    if (latestData.length === 0) {
      res
        .status(404)
        .json({ message: "No se encontraron datos de eventos del partido" });
    } else {
      res.status(200).json(latestData[0]); // Solo devolver el primer evento
    }
  } catch (error) {
    console.error("Error al obtener los últimos datos del partido:", error);
    res.status(500).json({ error: "Error Interno de Servidor" });
  }
};

exports.marcador = async (req, res) => {
  try {
    const results = await Match.findAll({
      attributes: ["scoreLocal", "scoreVisitor", "setsLocal", "setsVisitor"],
      order: [["id", "DESC"]],
    });
    res.status(200).json(results[0]);
  } catch (error) {
    res.status(500).json({ error: "error interno servidor" });
  }
};
exports.resumenTemporada = async (req, res) => {
  const userId = req.userId; // El userId que se pasa a la función (supuestamente está autenticado)

  try {
    // Primero obtenemos el playerId asociado al userId
    const player = await db.players.findOne({
      where: { mainUser: userId }, // mainUser es la relación entre usuarios y jugadores
      attributes: ["player_id"],
    });

    if (!player) {
      return res
        .status(404)
        .json({ message: "Jugador no encontrado para este usuario." });
    }

    const playerId = player.player_id;

    // Realizamos la consulta de resumen de temporada usando el playerId
    const resumen = await sequelize.query(
      `
            SELECT
                p.player_name,
                ft.isSuccess,
                COUNT(ft.isSuccess) AS event_count
            FROM players p
            LEFT JOIN matchevents me ON p.player_id = me.playerId 
            LEFT JOIN faulttypes ft ON me.eventId = ft.id
            WHERE me.playerId = :playerId 
            GROUP BY p.player_name, ft.isSuccess;
        `,
      {
        replacements: { playerId },
        type: QueryTypes.SELECT,
      }
    );

    res.status(200).json(resumen);
  } catch (error) {
    console.error("Error al obtener el resumen de temporada:", error);
    res.status(500).json({ error: "Error Interno de Servidor" });
  }
};
exports.resumenTemporadaPorFallos = async (req, res) => {
  const userId = req.userId; // El userId que se pasa a la función (supuestamente está autenticado)

  try {
    // Primero obtenemos el playerId asociado al userId
    const player = await db.players.findOne({
      where: { mainUser: userId }, // mainUser es la relación entre usuarios y jugadores
      attributes: ["player_id"],
    });

    if (!player) {
      return res
        .status(404)
        .json({ message: "Jugador no encontrado para este usuario." });
    }

    const playerId = player.player_id;

    // Realizamos la consulta de resumen de temporada usando el playerId
    const resumen = await sequelize.query(
      `
        SELECT
                p.player_name,
                me.eventId,
                ft.type,
                ft.isSuccess,
                COUNT(me.eventId) AS event_count
            FROM players p
            LEFT JOIN matchevents me ON p.player_id = me.playerId 
            LEFT JOIN faulttypes ft ON me.eventId = ft.id
            WHERE p.player_id = :playerId
            GROUP BY p.player_name, me.eventId, ft.type
            ORDER BY p.player_name, me.eventId;
        `,
      {
        replacements: { playerId },
        type: QueryTypes.SELECT,
      }
    );

    res.status(200).json(resumen);
  } catch (error) {
    console.error("Error al obtener el resumen de temporada:", error);
    res.status(500).json({ error: "Error Interno de Servidor" });
  }
};
exports.resumenTemporadaPorPartido = async (req, res) => {
  const userId = req.userId; // El userId que se pasa a la función (supuestamente está autenticado)

  try {
    // Primero obtenemos el playerId asociado al userId
    const player = await db.players.findOne({
      where: { mainUser: userId }, // mainUser es la relación entre usuarios y jugadores
      attributes: ["player_id"],
    });

    if (!player) {
      return res
        .status(404)
        .json({ message: "Jugador no encontrado para este usuario." });
    }

    const playerId = player.player_id;

    // Realizamos la consulta de resumen de temporada usando el playerId
    const resumen = await sequelize.query(
      `
                        SELECT
                    p.player_name,
                    datospartido.date,
                    ft.isSuccess,
                    COUNT(ft.isSuccess) AS count_isSuccess
                FROM players p
                LEFT JOIN matchevents me ON p.player_id = me.playerId
                LEFT JOIN faulttypes ft ON me.eventId = ft.id
                JOIN datospartido ON datospartido.id = me.matchId 
                WHERE p.player_id = :playerId
                GROUP BY p.player_name, ft.isSuccess, datospartido.date
                ORDER BY p.player_name, datospartido.date, ft.isSuccess;

        `,
      {
        replacements: { playerId },
        type: QueryTypes.SELECT,
      }
    );

    res.status(200).json(resumen);
  } catch (error) {
    console.error("Error al obtener el resumen de temporada:", error);
    res.status(500).json({ error: "Error Interno de Servidor" });
  }
};
exports.getOldestUserIdForTeam = async (req, res) => {
  const equipoId = parseInt(req.params.equipoId, 10);
  const userId = req.userId;

  console.log(userId);

  console.log("Equipo ID:", equipoId);

  try {
    const userTeams = await User.findByPk(userId, {
      include: {
        model: Equipo,
        as: "useras",
      },
    });
    if (userTeams && userTeams.useras) {
      const equipoIds = userTeams.useras.map((equipo) => equipo.dataValues.id);
      const matches = await db.partido.findAll({
        where: { equipoId: equipoIds },
        attributes: ["id"],
      });
      console.log(matches);
      // Extraer solo los IDs en un array
      const matchIds = matches.map((match) => match.id);

      if (matchIds.length > 0) {
        const resumen = await sequelize.query(
          `
                    SELECT p.player_name, ft.isSuccess, COUNT(ft.isSuccess) AS coonta
                    FROM matchevents
                    JOIN faulttypes ft ON matchevents.eventId = ft.id
                    JOIN players p ON matchevents.playerId = p.player_id
                    WHERE matchevents.matchId IN (:matchIds)
                    GROUP BY p.player_name, ft.isSuccess
                `,
          {
            replacements: { matchIds },
            type: QueryTypes.SELECT,
          }
        );

        res.json(resumen);
      } else {
        res
          .status(404)
          .json({ message: "No matches found for the given equipoId." });
      }
    } else {
      console.log("No se encontraron equipos para este usuario.");
    }
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
exports.getEventDetails2 = async (req, res) => {
  const userId = req.userId;
  const matchId = parseInt(req.params.matchId, 10); // Obtener el ID del partido desde los parámetros de la solicitud
  console.log("hola", matchId);
  try {
    const partido = await db.partido.findAll({
      where:{id:matchId}
    })
   
    res.status(200).json(partido);
  } catch (error) {
    console.error("Error al obtener detalles del evento:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.puntoapunto = async (req, res) => {
  const matchId = req.params.id;
  try {
    const eventos = await db.matchevent.findAll({
      attributes: [
        'setsLocal',
        'scoreLocal',
        'scoreVisitor',
        'id',
        'setsVisitor','eventId', 'playerId'
      ],
      where: {
        matchId: matchId,
      },
      include: [
        {
          model: db.faulttype,
          as: 'event', // Alias definido en la asociación
          attributes: ['type','id'], // Campos que quieres incluir de faulttype
        },
        {
          model: db.players,
          as: 'player', // Alias definido en la asociación
          attributes: ['player_name','player_id'], // Campos que quieres incluir de players
        },
        {
          model: db.annotations,
          as: 'annotations', // Alias definido en la asociación
          attributes: ['nombre', 'id','createdAt'], // Campos que quieres incluir de annotations
        },
        
      ],
      order: [['setsLocal', 'ASC'], ['setsVisitor', 'ASC'],['id', 'ASC'],],
    });
    const agrupadosPorSets = eventos.reduce((result, evento) => {
      const key = `${evento.setsLocal}-${evento.setsVisitor}`;
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(evento);
      return result;
    }, {});

    const eventosPorSet = Object.values(agrupadosPorSets);

    if (eventosPorSet.length > 0) {
      const eventosConAnotaciones = eventosPorSet.map(set => {
        return set.map(evento => {
          if (!evento.annotations || evento.annotations.length === 0) {
            evento.annotations = [{ annotation: "Ninguna anotación para este punto" }];
          }
          return evento;
        });
      });
      res.json(eventosConAnotaciones);
    } else {
      res.json("No se han encontrado eventos");
    }
  } catch (error) {
    res.json({ error: error.message });
  }
};
exports.editarEvento = async (req,res)=>{
  const matchEventId = req.params.id;
  const playerId = req.body.player.player_id;
  const eventId = req.body.eventId;
  const annotationText = req.body.annotation;

  try {
    // Actualizar el evento en matchevents
    const matchEvent = await db.matchevent.findByPk(matchEventId);
    if (!matchEvent) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    matchEvent.eventId = eventId;
    matchEvent.playerId = playerId;
    await matchEvent.save();

    // Agregar la anotación en annotations
    const annotation = await db.annotations.create({
      nombre: annotationText,
      playerId: playerId,
      matchEventId: matchEventId
    });

    res.status(200).json({
      message: 'Evento y anotación actualizados correctamente',
      matchEvent,
      annotation
    });
  } catch (error) {
    console.error('Error al editar el evento:', error);
    res.status(500).json({ message: 'Error al editar el evento' });
  }
};

