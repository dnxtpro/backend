process.env.NODE_ENV = 'production';
const db = require('../model');

// Seed ~100 random action_registers for match 122
// match_id=122, team_id=69
// Players: 135(Rival), 136(Ana), 137(Paula Sosa), 138(Camila), 139(Fati), 140(Vero), 141(Olga)
// action_type_id: 1=Saque, 2=Recepción, 3=Ataque, 4=Colocación
// Ratings by action_type:
//   Saque (1): 1=#, 2=/, 3=+, 4=-, 19==
//   Recepción (2): 5=#, 6=+, 7=-, 8=/, 9==
//   Ataque (3): 10=#, 11=+, 12=-, 13=/, 14==
//   Colocación (4): 15=#, 16=+, 17=-, 18=/

const playerIds = [136, 137, 138, 139, 140, 141]; // exclude Rival (135)
const actionRatings = {
  1: [1, 2, 3, 4, 19],  // Saque
  2: [5, 6, 7, 8, 9],   // Recepción
  3: [10, 11, 12, 13, 14], // Ataque
  4: [15, 16, 17, 18],  // Colocación
};
const actionWeights = { 1: 0.25, 2: 0.35, 3: 0.25, 4: 0.15 }; // realistic proportions

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickActionType() {
  const r = Math.random();
  if (r < 0.25) return 1;
  if (r < 0.60) return 2;
  if (r < 0.85) return 3;
  return 4;
}

(async () => {
  try {
    // Check current count
    const [cnt] = await db.sequelize.query(
      `SELECT COUNT(*) as c FROM action_registers WHERE match_id = 122`
    );
    console.log('Existing action_registers for match 122:', cnt[0].c);

    // Build 100 rows
    const records = [];
    let rally = 1;
    for (let set = 1; set <= 3; set++) {
      for (let i = 0; i < 33; i++) {
        const actionType = pickActionType();
        const ratings = actionRatings[actionType];
        records.push({
          match_id: 122,
          set_number: set,
          player_id: pick(playerIds),
          team_id: 69,
          action_type_id: actionType,
          rating_id: pick(ratings),
          timestamp_in_set: Math.floor(Math.random() * 1500) + i * 10,
          rally_number: rally++,
        });
      }
    }

    // Insert all
    let inserted = 0;
    for (const r of records) {
      await db.sequelize.query(`
        INSERT INTO action_registers
          (match_id, set_number, player_id, team_id, action_type_id, rating_id, timestamp_in_set, rally_number)
        VALUES
          (${r.match_id}, ${r.set_number}, ${r.player_id}, ${r.team_id},
           ${r.action_type_id}, ${r.rating_id}, ${r.timestamp_in_set}, ${r.rally_number})
      `);
      inserted++;
    }

    console.log(`✅ Inserted ${inserted} action_registers for match 122`);

    // Verify
    const [cnt2] = await db.sequelize.query(
      `SELECT COUNT(*) as c FROM action_registers WHERE match_id = 122`
    );
    console.log('Total after insert:', cnt2[0].c);

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
