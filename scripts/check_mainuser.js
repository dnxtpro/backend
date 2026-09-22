const db = require('../model');

async function checkAndSetPreselected() {
  // Ensure all 18 players have mainUser = null and status = 'PRESELECTED'
  await db.sequelize.query("UPDATE players SET status = 'PRESELECTED' WHERE equipoId = 72 AND player_name != 'Rival'");

  const [rows] = await db.sequelize.query('SELECT player_id, player_name, apellidos, dorsal, position_id, userId, mainUser, status FROM players WHERE equipoId = 72 ORDER BY dorsal ASC');
  console.log('--- Team 72 players status & mainUser ---');
  rows.forEach(r => {
    console.log(`#${r.dorsal} | ${r.player_name} ${r.apellidos || ''} | status: ${r.status} | mainUser: ${r.mainUser}`);
  });

  process.exit(0);
}
checkAndSetPreselected();
