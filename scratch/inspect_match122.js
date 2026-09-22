process.env.NODE_ENV = 'production';
const db = require('../model');

(async () => {
  try {
    // Inspect action_registers and action_types
    const [actionTypes] = await db.sequelize.query(`SELECT * FROM action_types LIMIT 20`);
    console.log('action_types:', actionTypes);

    const [actionRatings] = await db.sequelize.query(`SELECT * FROM action_ratings LIMIT 20`);
    console.log('action_ratings:', actionRatings);

    // Inspect action_registers schema
    const [arSchema] = await db.sequelize.query(`DESCRIBE action_registers`);
    console.log('action_registers schema:', arSchema.map(c => c.Field));

    // Sample action_registers for match 122
    const [arSample] = await db.sequelize.query(`SELECT * FROM action_registers WHERE matchId = 122 LIMIT 5`);
    console.log('action_registers for match 122:', arSample);

    // Count existing
    const [cnt] = await db.sequelize.query(`SELECT COUNT(*) as c FROM action_registers WHERE matchId = 122`);
    console.log('Total action_registers for 122:', cnt[0].c);

    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
