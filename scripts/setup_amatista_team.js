const db = require('../model');
const { Op } = require('sequelize');

const TARGET_ROSTER = [
  { name: 'Blanca Guarinos Beato', position_id: 1, dorsal: 1 },
  { name: 'Inma Jurado', position_id: 1, dorsal: 2 },
  { name: 'Safia Pérez Mora', position_id: 5, dorsal: 3 },
  { name: 'Cristina Falcón Pérez', position_id: 5, dorsal: 4 },
  { name: 'Mariló Payer Pérez', position_id: 5, dorsal: 5 },
  { name: 'Verónica Tirado García', position_id: 5, dorsal: 6 },
  { name: 'Marina Vizuete Sánchez', position_id: 2, dorsal: 7 },
  { name: 'Fati Vazquez', position_id: 4, dorsal: 8 },
  { name: 'Camilla Garagna', position_id: 2, dorsal: 9 },
  { name: 'Paula Sosa Hernández', position_id: 2, dorsal: 10 },
  { name: 'Aroa Millán Prieto', position_id: 5, dorsal: 11 },
  { name: 'Rocío Bermejo Pérez', position_id: 2, dorsal: 12 },
  { name: 'Vera Ferrete Collantes', position_id: 2, dorsal: 13 },
  { name: 'Paula Lupiani', position_id: 4, dorsal: 14 },
  { name: 'Elena Baron', position_id: 2, dorsal: 15 },
  { name: 'Izy Fernández Morales', position_id: 3, dorsal: 16 },
  { name: 'Olga Tejada Vega', position_id: 3, dorsal: 17 },
  { name: 'Ana Leal Díaz', position_id: 4, dorsal: 18 }
];

async function run() {
  try {
    console.log('--- Starting Amatista Team Setup ---');

    const user = await db.user.findOne({ where: { username: 'dnxtpro' } });
    if (!user) {
      throw new Error('User dnxtpro not found');
    }
    const userId = user.id;
    console.log(`Target user: ${user.username} (ID: ${userId})`);

    // 1. Find all teams matching Amatista
    const amatistaTeams = await db.equipo.findAll({
      where: { nombre: { [Op.like]: '%Amatista%' } }
    });

    console.log(`Found ${amatistaTeams.length} Amatista teams:`);
    for (const t of amatistaTeams) {
      const matchCount = await db.partido.count({ where: { equipoId: t.id } });
      const playerCount = await db.players.count({ where: { equipoId: t.id } });
      console.log(` - ID: ${t.id}, Name: "${t.nombre}", Matches: ${matchCount}, Players: ${playerCount}`);
    }

    // Inspect team 69 details
    for (const t of amatistaTeams) {
      if (t.id === 69) {
        const matches = await db.partido.findAll({ where: { equipoId: 69 } });
        console.log(`Team 69 matches:`, matches.map(m => ({ id: m.id, date: m.fecha, rival: m.rival })));
        const players69 = await db.players.findAll({ where: { equipoId: 69 } });
        console.log(`Team 69 players:`, players69.map(p => ({ id: p.player_id, name: p.player_name })));
      }
    }

    // If targetTeam doesn't exist, create it
    if (!targetTeam) {
      console.log('Creating team "Senior Femenino Amatista"...');
      targetTeam = await db.equipo.create({ nombre: 'Senior Femenino Amatista' });
    } else {
      console.log(`Using existing team ID ${targetTeam.id} ("${targetTeam.nombre}")`);
    }

    // Associate team with user
    await targetTeam.addEquipa(userId);
    console.log(`✓ Associated team ${targetTeam.id} to user ${userId}`);

    // Ensure 'Rival' player exists
    const rival = await db.players.findOne({
      where: { equipoId: targetTeam.id, player_name: 'Rival' }
    });
    if (!rival) {
      await db.players.create({
        player_name: 'Rival',
        dorsal: 0,
        position_id: 1,
        userId: userId,
        equipoId: targetTeam.id,
        status: 'ACTIVE'
      });
      console.log('✓ Created Rival player');
    }

    // Clean up existing players in this team that are not in TARGET_ROSTER or Rival
    const existingPlayers = await db.players.findAll({ where: { equipoId: targetTeam.id } });
    console.log(`Currently ${existingPlayers.length} players in team ${targetTeam.id}`);

    // Now insert or update the 18 players
    for (const item of TARGET_ROSTER) {
      const parts = item.name.split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');

      // Find by full name or first name in this team
      let pl = existingPlayers.find(p =>
        p.player_name.toLowerCase().trim() === item.name.toLowerCase().trim() ||
        (p.player_name.toLowerCase().trim() === firstName.toLowerCase().trim() && (!p.apellidos || p.apellidos.toLowerCase().includes(parts[1]?.toLowerCase() || '')))
      );

      if (pl) {
        console.log(`Updating existing player ID ${pl.player_id}: ${item.name} -> pos: ${item.position_id}`);
        await pl.update({
          player_name: firstName,
          apellidos: lastName,
          position_id: item.position_id,
          dorsal: pl.dorsal || item.dorsal,
          status: 'ACTIVE',
          userId: userId
        });
      } else {
        console.log(`Creating player: ${item.name} (pos: ${item.position_id})`);
        await db.players.create({
          player_name: firstName,
          apellidos: lastName,
          position_id: item.position_id,
          dorsal: item.dorsal,
          userId: userId,
          equipoId: targetTeam.id,
          status: 'ACTIVE'
        });
      }
    }

    // Verify all players
    const finalPlayers = await db.players.findAll({
      where: { equipoId: targetTeam.id },
      include: [{ model: db.positions, as: 'position' }],
      order: [['dorsal', 'ASC']]
    });

    console.log(`\n=== FINAL ROSTER FOR "${targetTeam.nombre}" (ID: ${targetTeam.id}) ===`);
    finalPlayers.forEach(p => {
      console.log(`#${p.dorsal} | ${p.player_name} ${p.apellidos || ''} | Pos: ${p.position ? p.position.position_name : 'N/A'} (ID: ${p.position_id}) | Status: ${p.status}`);
    });

    console.log('\n✓ Amatista Team & Roster setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Setup error:', error);
    process.exit(1);
  }
}

run();
