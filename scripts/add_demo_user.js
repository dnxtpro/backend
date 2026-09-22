require('dotenv').config();
const db = require('../model');
const bcrypt = require('bcryptjs');

async function run() {
  await db.sequelize.authenticate();
  console.log("Connected to DB.");

  // 1. Create User (Coach)
  const user = await db.user.findOrCreate({
    where: { username: 'demo' },
    defaults: {
      username: 'demo',
      email: 'demo@example.com',
      password: bcrypt.hashSync('demo123', 8)
    }
  }).then(res => res[0]);

  // If user already existed, just to be sure we update the password to demo123
  await user.update({ password: bcrypt.hashSync('demo123', 8) });
  
  console.log("User ready:", user.id);

  // 2. Assign role 'entrenador'
  const role = await db.role.findOne({ where: { name: 'entrenador' } });
  if (role) {
    await user.addRole(role);
  }

  // 3. Find Team 'Voleibol Demo Club'
  const equipo = await db.equipo.findOne({
    where: { nombre: 'Voleibol Demo Club' }
  });

  if (equipo) {
    // Associate team with user
    await user.addUseras(equipo);
    console.log("Equipo found and assigned:", equipo.id);
  } else {
    console.log("Equipo 'Voleibol Demo Club' not found. Ensure seed_demo.js ran first.");
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
