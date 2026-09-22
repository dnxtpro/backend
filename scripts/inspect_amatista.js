const db = require('../model');

async function inspectTables() {
  try {
    const [partidoCols] = await db.sequelize.query('SHOW COLUMNS FROM datospartido');
    console.log('Columns in `datospartido`:', partidoCols.map(c => c.Field));

    const [playersCols] = await db.sequelize.query('SHOW COLUMNS FROM players');
    console.log('Columns in `players`:', playersCols.map(c => c.Field));

    const [matches69] = await db.sequelize.query('SELECT * FROM datospartido WHERE equipoId = 69');
    console.log('Matches for team 69:', matches69);

    const [matches72] = await db.sequelize.query('SELECT * FROM datospartido WHERE equipoId = 72');
    console.log('Matches for team 72:', matches72);

    const [players69] = await db.sequelize.query('SELECT player_id, player_name, dorsal, position_id FROM players WHERE equipoId = 69');
    console.log('Players in team 69:', players69);

    const [players72] = await db.sequelize.query('SELECT player_id, player_name, dorsal, position_id FROM players WHERE equipoId = 72');
    console.log('Players in team 72:', players72);

    process.exit(0);
  } catch (err) {
    console.error('Inspect error:', err);
    process.exit(1);
  }
}

inspectTables();
