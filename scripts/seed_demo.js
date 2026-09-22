require('dotenv').config();
const db = require('../model');
const bcrypt = require('bcryptjs');

async function run() {
  await db.sequelize.authenticate();
  console.log("Connected to DB.");

  // 1. Create User (Coach)
  const user = await db.user.findOrCreate({
    where: { email: 'demo-1@example.com' },
    defaults: {
      username: 'demo-1',
      password: bcrypt.hashSync('Locoplaya2002', 8)
    }
  }).then(res => res[0]);

  console.log("User ready:", user.id);

  // 2. Assign role 'entrenador'
  const role = await db.role.findOne({ where: { name: 'entrenador' } });
  if (role) {
    await user.addRole(role);
  }

  // 3. Create Team
  const equipo = await db.equipo.findOrCreate({
    where: { nombre: 'Voleibol Demo Club' },
    defaults: { nombre: 'Voleibol Demo Club' }
  }).then(res => res[0]);

  // Associate team with user
  await user.addUseras(equipo);

  console.log("Equipo ready:", equipo.id);

  // 4. Create Positions
  const posNames = ['Colocador', 'Receptor', 'Central', 'Opuesto', 'Libero'];
  const posMap = {};
  for (const p of posNames) {
    const pos = await db.positions.findOrCreate({
      where: { position_name: p },
      defaults: { position_name: p }
    }).then(res => res[0]);
    posMap[p] = pos.position_id;
  }

  // 5. Create Players
  const playerDefs = [
    { name: 'Ilias Afailal', dorsal: 1, pos: 'Opuesto' },
    { name: 'Javier Burgos', dorsal: 2, pos: 'Colocador' },
    { name: 'Jaime Rodríguez', dorsal: 3, pos: 'Receptor' },
    { name: 'Ismael Galán', dorsal: 6, pos: 'Receptor' },
    { name: 'Pedro Padilla', dorsal: 7, pos: 'Central' },
    { name: 'Danil Loginov', dorsal: 8, pos: 'Central' },
    { name: 'David Pérez', dorsal: 9, pos: 'Libero' },
    { name: 'Joaquín Martín', dorsal: 10, pos: 'Receptor' },
    { name: 'Jorge Batista', dorsal: 12, pos: 'Central' },
    { name: 'Javier Durán', dorsal: 13, pos: 'Opuesto' },
    { name: 'Álvaro Bornez', dorsal: 21, pos: 'Colocador' }
  ];

  const players = [];
  for (const def of playerDefs) {
    const player = await db.players.findOrCreate({
      where: { dorsal: def.dorsal, equipoId: equipo.id },
      defaults: {
        player_name: def.name,
        dorsal: def.dorsal,
        position_id: posMap[def.pos],
        equipoId: equipo.id,
        userId: user.id
      }
    }).then(res => res[0]);
    players.push(player);
  }
  
  console.log("Players ready.");

  // 6. Create Match
  const partido = await db.partido.create({
    equipo_local: equipo.nombre,
    rivalTeam: 'Rival FC',
    date: new Date(),
    location: 'Pabellón Principal',
    userId: user.id,
    equipoId: equipo.id
  });

  console.log("Match ready:", partido.id);

  // 7. Simulate Match Events (3 Sets)
  // Let's create a realistic distribution for 3 sets
  const sets = [
    { num: 1, local: 25, visitor: 19 },
    { num: 2, local: 25, visitor: 21 },
    { num: 3, local: 25, visitor: 23 }
  ];

  const actions = [];
  const events = [];

  // Helpers to pick random player
  const getPlayer = (pos) => players.filter(p => playerDefs.find(d => d.dorsal === p.dorsal).pos === pos).sort(() => 0.5 - Math.random())[0];
  const getAnyPlayer = () => players[Math.floor(Math.random() * players.length)];

  for (const set of sets) {
    let localScore = 0;
    let visitorScore = 0;
    let rallyCount = 1;
    let timestampInSet = 10.0; // starts at 10 seconds

    while (localScore < set.local || visitorScore < set.visitor) {
      // Determine who wins this point based on target score
      let pointLocal = false;
      if (localScore < set.local && visitorScore < set.visitor) {
        pointLocal = Math.random() > 0.45; // slightly favor local
      } else if (localScore < set.local) {
        pointLocal = true;
      } else {
        pointLocal = false;
      }

      const isAtaque = Math.random() > 0.3;
      const isSaqueDirecto = Math.random() < 0.05;
      const isErrorRival = Math.random() < 0.15;

      // 1. Saque (Local always serves in this simulation for simplicity, or we just randomly assign)
      const server = getAnyPlayer();
      actions.push({
        match_id: partido.id, set_number: set.num, player_id: server.player_id, team_id: equipo.id,
        action_type_id: 1, // Saque
        rating_id: pointLocal && isSaqueDirecto ? 1 : (Math.random() > 0.8 ? 2 : 3), // # or + or !
        timestamp_in_set: timestampInSet, rally_number: rallyCount
      });

      if (pointLocal) {
        localScore++;
        if (isSaqueDirecto) {
          // Point by serve
          events.push({ matchId: partido.id, actionType: 'Saque Directo', timestamp: new Date(Date.now() + timestampInSet * 1000), playerId: server.player_id, scoreLocal: localScore, setsLocal: set.num - 1, scoreVisitor: visitorScore, setsVisitor: 0, eventId: 1, userId: user.id, tieneSaque: true });
        } else if (isAtaque) {
          // Reception, Colocacion, Ataque
          const receptor = getPlayer('Receptor') || getPlayer('Libero') || getAnyPlayer();
          const setter = getPlayer('Colocador') || getAnyPlayer();
          const attacker = getPlayer('Opuesto') || getPlayer('Receptor') || getAnyPlayer();
          
          actions.push({ match_id: partido.id, set_number: set.num, player_id: receptor.player_id, team_id: equipo.id, action_type_id: 2, rating_id: 7, timestamp_in_set: timestampInSet + 2, rally_number: rallyCount }); // Rec #
          actions.push({ match_id: partido.id, set_number: set.num, player_id: setter.player_id, team_id: equipo.id, action_type_id: 4, rating_id: 19, timestamp_in_set: timestampInSet + 4, rally_number: rallyCount }); // Col #
          actions.push({ match_id: partido.id, set_number: set.num, player_id: attacker.player_id, team_id: equipo.id, action_type_id: 3, rating_id: 13, timestamp_in_set: timestampInSet + 6, rally_number: rallyCount }); // Atk #
          
          events.push({ matchId: partido.id, actionType: 'Ataque', timestamp: new Date(Date.now() + timestampInSet * 1000), playerId: attacker.player_id, scoreLocal: localScore, setsLocal: set.num - 1, scoreVisitor: visitorScore, setsVisitor: 0, eventId: 1, userId: user.id, tieneSaque: true });
        } else {
          // Error rival
          events.push({ matchId: partido.id, actionType: 'Error Rival', timestamp: new Date(Date.now() + timestampInSet * 1000), playerId: getAnyPlayer().player_id, scoreLocal: localScore, setsLocal: set.num - 1, scoreVisitor: visitorScore, setsVisitor: 0, eventId: 1, userId: user.id, tieneSaque: true });
        }
      } else {
        visitorScore++;
        // Visitor point (Error of local)
        if (isAtaque) {
          const attacker = getPlayer('Opuesto') || getAnyPlayer();
          actions.push({ match_id: partido.id, set_number: set.num, player_id: attacker.player_id, team_id: equipo.id, action_type_id: 3, rating_id: 18, timestamp_in_set: timestampInSet + 6, rally_number: rallyCount }); // Atk Error
          events.push({ matchId: partido.id, actionType: 'Fallo Ataque', timestamp: new Date(Date.now() + timestampInSet * 1000), playerId: attacker.player_id, scoreLocal: localScore, setsLocal: set.num - 1, scoreVisitor: visitorScore, setsVisitor: 0, eventId: 1, userId: user.id, tieneSaque: false });
        } else {
           events.push({ matchId: partido.id, actionType: 'Fallo Saque', timestamp: new Date(Date.now() + timestampInSet * 1000), playerId: server.player_id, scoreLocal: localScore, setsLocal: set.num - 1, scoreVisitor: visitorScore, setsVisitor: 0, eventId: 1, userId: user.id, tieneSaque: false });
           actions.push({ match_id: partido.id, set_number: set.num, player_id: server.player_id, team_id: equipo.id, action_type_id: 1, rating_id: 6, timestamp_in_set: timestampInSet + 2, rally_number: rallyCount }); // Saque Error
        }
      }

      rallyCount++;
      timestampInSet += 30; // 30 seconds per rally
    }
  }

  // Generate some defense
  // Action type 6 = Defense (rating 31 = # maybe? Let's query to be safe, but for now omit to not break foreign keys if ID is wrong)

  // Insert all
  await db.actionRegister.bulkCreate(actions);
  
  // Need a default faulttype if doesn't exist
  const ft = await db.faulttype.findOrCreate({ where: { id: 1 }, defaults: { name: 'Punto' } }).then(res => res[0]);
  
  await db.matchevent.bulkCreate(events.map(e => ({...e, eventId: ft.id})));

  console.log("Match events and actions generated! Total actions:", actions.length, "Total events:", events.length);
  console.log("Match ID is:", partido.id);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
