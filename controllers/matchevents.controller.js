const db = require("../model");
const Match = db.matchevent;
const { QueryTypes } = require('sequelize');
const sequelize = db.sequelize;

exports.createEvent = async (req,res) =>{
    console.log('g1',req.body,'hl')
    const {matchId,actionType,playerId,scoreLocal,scoreVisitor,setsLocal,setsVisitor,eventId}=req.body.matchEventData;
    const userId = req.userId;
    const event={
        matchId,actionType,playerId,scoreLocal,scoreVisitor,setsLocal,setsVisitor,eventId,userId
    }
    try{
        const createdEvent=await Match.create(event);
        res.status(201).json(createdEvent)
    }
    catch(error){
        console.error("Error al agregar evento:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getEventDetails = async (req, res) => {
    const matchId = parseInt(req.params.matchId, 10); // Obtener el ID del partido desde los parámetros de la solicitud
console.log('hola',matchId)
    try {
        const eventDetails = await sequelize.query(`
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
                WHERE matchId = :matchId
            ) AS t
            LEFT JOIN matchevents me ON p.player_id = me.playerId 
                AND (me.setsLocal + me.setsVisitor + 1) = t.total_sets 
                AND me.matchId = :matchId
            LEFT JOIN faulttypes ft ON me.eventId = ft.id
            WHERE me.matchId = :matchId
            GROUP BY p.player_name, t.total_sets, me.eventId, ft.type
            ORDER BY p.player_name, t.total_sets, me.eventId;
        `, {
            replacements: { matchId }, // Sustituye :matchId por el valor del ID del partido
            type: QueryTypes.SELECT
        });

        res.status(200).json(eventDetails);
    } catch (error) {
        console.error("Error al obtener detalles del evento:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.resumenJugador = async(req,res)=>{
    const matchId = parseInt(req.params.matchId, 10);
    try{
        const resumen=await sequelize.query(`
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
            `,{
                replacements:{matchId},
                type: QueryTypes.SELECT
            });
            res.status(200).json(resumen);
    }
    catch(error){
        res.status(500).json({error: 'Error Interno de Servidor'})
    }

};
exports.ultimoseventos = async (req,res) => {
    const matchId = parseInt(req.params.matchId, 10);
    console.log('Llamada recibida',matchId);

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
            type: QueryTypes.SELECT
        });

        console.log("Eventos del partido recuperados con éxito:", results);
        const events = results;
        return res.json(events);  // Devuelve los resultados directamente
    } catch (error) {
        console.error("Error al obtener eventos del partido:", error);
        throw error; // Lanza el error para que pueda ser manejado por la función que llame a `ultimoseventos`
    }
};
