const db = require('../model');
const { Op } = require('sequelize');

const PLAYERS_SPEC = [
  { name: 'Blanca', apellidos: 'Guarinos Beato', position_id: 1, dorsal: 1 }, // Colocadora
  { name: 'Inma', apellidos: 'Jurado', position_id: 1, dorsal: 5 },          // Colocadora
  { name: 'Safia', apellidos: 'Pérez Mora', position_id: 5, dorsal: 3 },      // Central
  { name: 'Cristina', apellidos: 'Falcón Pérez', position_id: 5, dorsal: 4 }, // Central
  { name: 'Mariló', apellidos: 'Payer Pérez', position_id: 5, dorsal: 7 },    // Central
  { name: 'Verónica', apellidos: 'Tirado García', position_id: 5, dorsal: 12 },// Central (Vero)
  { name: 'Marina', apellidos: 'Vizuete Sánchez', position_id: 2, dorsal: 8 }, // Receptora
  { name: 'Fati', apellidos: 'Vazquez', position_id: 4, dorsal: 6 },          // Opuesta
  { name: 'Camilla', apellidos: 'Garagna', position_id: 2, dorsal: 97 },      // Receptora
  { name: 'Paula', apellidos: 'Sosa Hernández', position_id: 2, dorsal: 22 }, // Receptora
  { name: 'Aroa', apellidos: 'Millán Prieto', position_id: 5, dorsal: 11 },   // Central
  { name: 'Rocío', apellidos: 'Bermejo Pérez', position_id: 2, dorsal: 13 },  // Receptora
  { name: 'Vera', apellidos: 'Ferrete Collantes', position_id: 2, dorsal: 14 },// Receptora
  { name: 'Paula', apellidos: 'Lupiani', position_id: 4, dorsal: 15 },        // Opuesta
  { name: 'Elena', apellidos: 'Baron', position_id: 2, dorsal: 18 },          // Receptora
  { name: 'Izzy', apellidos: 'Fernández Morales', position_id: 3, dorsal: 10 },// Líbero
  { name: 'Olga', apellidos: 'Tejada Vega', position_id: 3, dorsal: 21 },     // Líbero
  { name: 'Ana', apellidos: 'Leal Díaz', position_id: 4, dorsal: 9 }          // Opuesta
];

async function setup() {
  console.log('--- Setting up Senior Femenino Amatista cleanly ---');
  const user = await db.user.findOne({ where: { username: 'dnxtpro' } });
  if (!user) throw new Error('User dnxtpro not found');
  const userId = user.id;

  // 1. Identify teams
  let team72 = await db.equipo.findByPk(72);
  let team69 = await db.equipo.findByPk(69);

  if (!team72) {
    console.log('Team 72 not found, searching or creating "Senior Femenino Amatista"...');
    team72 = await db.equipo.findOne({ where: { nombre: 'Senior Femenino Amatista' } });
    if (!team72) {
      team72 = await db.equipo.create({ nombre: 'Senior Femenino Amatista' });
    }
  }

  // Ensure user is linked to team 72
  await team72.addEquipa(userId);
  console.log(`✓ Linked user dnxtpro (id: ${userId}) to team "${team72.nombre}" (id: ${team72.id})`);

  // Ensure Rival player exists in team 72
  let rival = await db.players.findOne({ where: { equipoId: team72.id, player_name: 'Rival' } });
  if (!rival) {
    rival = await db.players.create({
      player_name: 'Rival',
      dorsal: 0,
      position_id: 1,
      userId: userId,
      equipoId: team72.id,
      status: 'ACTIVE'
    });
  } else {
    await rival.update({ dorsal: 0, position_id: 1, status: 'ACTIVE' });
  }
  console.log(`✓ Rival player ensured (id: ${rival.player_id})`);

  // 2. Map and update the 18 players in team 72
  const existingTeam72Players = await db.players.findAll({ where: { equipoId: team72.id } });
  console.log(`Team 72 has currently ${existingTeam72Players.length} players`);

  const assignedIds = new Set();
  // We want exact mapping
  for (const spec of PLAYERS_SPEC) {
    // Find matching unassigned player in team 72
    let matched = existingTeam72Players.find(p =>
      !assignedIds.has(p.player_id) && (
        p.player_name.toLowerCase().trim() === spec.name.toLowerCase().trim() ||
        p.player_name.toLowerCase().trim() === (spec.name + ' ' + spec.apellidos).toLowerCase().trim() ||
        (p.apellidos && p.apellidos.toLowerCase().trim() === spec.apellidos.toLowerCase().trim())
      )
    );

    if (matched) {
      assignedIds.add(matched.player_id);
      console.log(`Updating player ${matched.player_id}: ${spec.name} ${spec.apellidos} -> pos: ${spec.position_id}, dorsal: ${spec.dorsal}`);
      await matched.update({
        player_name: spec.name,
        apellidos: spec.apellidos,
        position_id: spec.position_id,
        dorsal: spec.dorsal,
        status: matched.status && matched.status !== 'PRESELECTED' ? matched.status : 'ACTIVE',
        userId: userId
      });
    } else {
      console.log(`Creating player: ${spec.name} ${spec.apellidos} -> pos: ${spec.position_id}, dorsal: ${spec.dorsal}`);
      const newP = await db.players.create({
        player_name: spec.name,
        apellidos: spec.apellidos,
        position_id: spec.position_id,
        dorsal: spec.dorsal,
        equipoId: team72.id,
        userId: userId,
        status: 'ACTIVE'
      });
      assignedIds.add(newP.player_id);
    }
  }

  // Remove any duplicate placeholder player in team 72 that has null dorsal and null position and is not in spec
  const refreshed72 = await db.players.findAll({ where: { equipoId: team72.id } });
  for (const p of refreshed72) {
    if (p.player_name === 'Rival') continue;
    if (!assignedIds.has(p.player_id) && p.dorsal === null && p.position_id === null) {
      console.log(`Removing extra placeholder player ${p.player_id} (${p.player_name}) from team 72`);
      await p.destroy();
    }
  }

  // 3. Handle old team 69 ("Amatista")
  if (team69) {
    console.log(`Handling old team 69 ("${team69.nombre}")...`);
    // Migrate matches from team 69 to team 72
    const matches69 = await db.sequelize.query('SELECT * FROM datospartido WHERE equipoId = 69', { type: db.Sequelize.QueryTypes.SELECT });
    if (matches69.length > 0) {
      console.log(`Migrating ${matches69.length} match(es) from team 69 to team 72...`);
      await db.sequelize.query('UPDATE datospartido SET equipoId = 72 WHERE equipoId = 69');
    }

    // Map any action_registers from players of team 69 to corresponding players in team 72
    const players69 = await db.players.findAll({ where: { equipoId: 69 } });
    const final72Players = await db.players.findAll({ where: { equipoId: 72 } });

    for (const p69 of players69) {
      // Find matching player in team 72
      const targetP = final72Players.find(p =>
        p.player_name.toLowerCase().trim() === p69.player_name.toLowerCase().trim() ||
        (p.dorsal === p69.dorsal && p.dorsal > 0)
      );
      if (targetP) {
        console.log(`Reassigning stats from player 69:${p69.player_id} (${p69.player_name}) to player 72:${targetP.player_id}`);
        await db.sequelize.query(`UPDATE action_registers SET player_id = ${targetP.player_id} WHERE player_id = ${p69.player_id}`);
        await db.sequelize.query(`UPDATE matchevents SET playerId = ${targetP.player_id} WHERE playerId = ${p69.player_id}`);
      }
    }

    // Now delete players of team 69
    console.log('Deleting old players of team 69...');
    await db.players.destroy({ where: { equipoId: 69 } });

    // Disassociate and remove team 69
    console.log('Removing old team 69...');
    await db.sequelize.query('DELETE FROM user_teams WHERE teamId = 69');
    await db.equipo.destroy({ where: { id: 69 } });
    console.log('✓ Old team 69 deleted successfully.');
  }

  // 4. Verification
  const [finalTeams] = await db.sequelize.query(`
    SELECT e.id, e.nombre, COUNT(p.player_id) as player_count
    FROM equipos e
    LEFT JOIN players p ON e.id = p.equipoId
    WHERE e.nombre LIKE '%Amatista%'
    GROUP BY e.id, e.nombre
  `);
  console.log('\nFinal Amatista teams in DB:', finalTeams);

  const [roster] = await db.sequelize.query(`
    SELECT p.player_id, p.dorsal, p.player_name, p.apellidos, pos.position_name, p.status
    FROM players p
    LEFT JOIN positions pos ON p.position_id = pos.position_id
    WHERE p.equipoId = 72
    ORDER BY p.dorsal ASC
  `);
  console.log(`\nFinal Roster for Senior Femenino Amatista (Count: ${roster.length}):`);
  roster.forEach(r => {
    console.log(`  #${r.dorsal} | ${r.player_name} ${r.apellidos || ''} | ${r.position_name} | status: ${r.status}`);
  });

  // Verify survey template instantiation for team 72
  let survey = await db.surveys.findOne({ where: { equipoId: 72 } });
  if (!survey) {
    console.log('\nCreating official survey "Construyamos la temporada | Senior Femenino" for team 72...');
    // We can call instantiateInitialTemplate logic
    survey = await db.surveys.create({
      title: 'Construyamos la temporada | Senior Femenino',
      description: 'Encuesta oficial de arranque y compromiso para la plantilla Senior Femenino Amatista.',
      equipoId: 72,
      created_by: userId,
      status: 'OPEN',
      results_published: false
    });

    const INITIAL_QUESTIONS = [
      { order: 1, title: '¿Cuáles son tus principales objetivos individuales y de equipo esta temporada?', type: 'LONG_TEXT', required: true },
      { order: 2, title: '¿En qué posición o faceta del juego sientes que aportas más valor al equipo?', type: 'SHORT_TEXT', required: true },
      { order: 3, title: 'Nivel de competitividad y exigencia que esperas en los entrenamientos', type: 'SINGLE_CHOICE', required: true, options: JSON.stringify(['Muy alto - Foco en ascenso y máxima exigencia', 'Alto - Competitivo pero conciliable', 'Medio - Disfrutar y competir los fines de semana', 'Formativo / En desarrollo']) },
      { order: 4, title: '¿Qué aspectos valoras más en el clima del vestuario y el grupo?', type: 'LONG_TEXT', required: true },
      { order: 5, title: '¿Estarías dispuesta a asumir responsabilidades de capitanía o liderazgo de grupo?', type: 'YES_NO', required: true },
      { order: 6, title: '¿Quién crees que representa mejor los valores para ser capitana del equipo?', type: 'SHORT_TEXT', required: false, description: 'Puedes nombrar una o dos compañeras' },
      { order: 7, title: 'Compromiso semanal de asistencia a entrenamientos y partidos (1 al 5)', type: 'SCALE', required: true, config: JSON.stringify({ min: 1, max: 5, minLabel: 'Bajo', maxLabel: 'Total (100%)' }) },
      { order: 8, title: 'Prioriza qué aspectos técnicos/tácticos crees que debemos trabajar con urgencia', type: 'RANKING', required: true, options: JSON.stringify(['Recepción y pase de saque', 'Defensa de campo y colocación libre', 'Ataque por alas y bolas rápidas', 'Bloqueo y lectura de red', 'Saque táctico y agresivo']) },
      { order: 9, title: 'Comentarios, sugerencias o inquietudes para el cuerpo técnico', type: 'LONG_TEXT', required: false }
    ];

    for (const q of INITIAL_QUESTIONS) {
      await db.surveyQuestions.create({
        survey_id: survey.id,
        ...q
      });
    }
    console.log(`✓ Created survey ID ${survey.id} with 9 questions.`);
  } else {
    console.log(`\nSurvey already exists for team 72 (ID: ${survey.id}, status: ${survey.status})`);
  }

  console.log('\n--- Setup completed successfully! ---');
  process.exit(0);
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
