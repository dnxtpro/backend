process.env.NODE_ENV = 'production';
const db = require('../model');
(async () => {
  const [results] = await db.sequelize.query(`
    SELECT dp.id, dp.equipo_local, dp.rivalTeam, dp.date,
           COUNT(me.id) as event_count
    FROM datospartido dp
    LEFT JOIN matchevents me ON me.matchId = dp.id
    GROUP BY dp.id
    HAVING event_count > 0
    ORDER BY event_count DESC
    LIMIT 10
  `);
  console.table(results);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
