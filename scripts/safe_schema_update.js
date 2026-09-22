const db = require('../model');

async function safeUpdate() {
  console.log('--- Starting safe additive database update ---');
  const queryInterface = db.sequelize.getQueryInterface();

  try {
    // 1. Sync models safely (creates missing tables without altering or dropping existing ones)
    console.log('Ensuring new tables exist (player_tokens, surveys, survey_questions, survey_responses)...');
    await db.sequelize.sync();
    console.log('✓ Tables synced successfully.');

    // 2. Safely check and add new columns to `players` table
    const tableDesc = await queryInterface.describeTable('players');

    if (!tableDesc.apellidos) {
      console.log('Adding column `apellidos` to `players`...');
      await queryInterface.addColumn('players', 'apellidos', {
        type: db.Sequelize.STRING,
        allowNull: true
      });
      console.log('✓ Column `apellidos` added.');
    } else {
      console.log('Column `apellidos` already exists.');
    }

    if (!tableDesc.status) {
      console.log('Adding column `status` to `players`...');
      await queryInterface.addColumn('players', 'status', {
        type: db.Sequelize.ENUM('PRESELECTED', 'INVITED', 'REGISTERED', 'ACTIVE', 'INACTIVE'),
        defaultValue: 'PRESELECTED',
        allowNull: false
      });
      console.log('✓ Column `status` added.');
    } else {
      console.log('Column `status` already exists.');
    }

    if (!tableDesc.secondary_positions) {
      console.log('Adding column `secondary_positions` to `players`...');
      await queryInterface.addColumn('players', 'secondary_positions', {
        type: db.Sequelize.TEXT,
        allowNull: true
      });
      console.log('✓ Column `secondary_positions` added.');
    } else {
      console.log('Column `secondary_positions` already exists.');
    }

    if (!tableDesc.years_playing) {
      console.log('Adding column `years_playing` to `players`...');
      await queryInterface.addColumn('players', 'years_playing', {
        type: db.Sequelize.INTEGER,
        allowNull: true
      });
      console.log('✓ Column `years_playing` added.');
    } else {
      console.log('Column `years_playing` already exists.');
    }

    if (!tableDesc.player_notes) {
      console.log('Adding column `player_notes` to `players`...');
      await queryInterface.addColumn('players', 'player_notes', {
        type: db.Sequelize.TEXT,
        allowNull: true
      });
      console.log('✓ Column `player_notes` added.');
    } else {
      console.log('Column `player_notes` already exists.');
    }

    if (!tableDesc.coach_notes) {
      console.log('Adding column `coach_notes` to `players`...');
      await queryInterface.addColumn('players', 'coach_notes', {
        type: db.Sequelize.TEXT,
        allowNull: true
      });
      console.log('✓ Column `coach_notes` added.');
    } else {
      console.log('Column `coach_notes` already exists.');
    }

    // Allow null on dorsal & position_id for preselected players without altering data
    console.log('Ensuring dorsal and position_id allow NULL...');
    await queryInterface.changeColumn('players', 'dorsal', {
      type: db.Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.changeColumn('players', 'position_id', {
      type: db.Sequelize.INTEGER,
      allowNull: true
    });
    console.log('✓ Column nullability updated.');

    const partidoDesc = await queryInterface.describeTable('datospartido');
    if (!partidoDesc.youtubeId) {
      console.log('Adding column `youtubeId` to `datospartido`...');
      await queryInterface.addColumn('datospartido', 'youtubeId', {
        type: db.Sequelize.STRING,
        allowNull: true
      });
      console.log('✓ Column `youtubeId` added.');
    } else {
      console.log('Column `youtubeId` already exists on `datospartido`.');
    }

    if (!partidoDesc.createdAt) {
      console.log('Adding column `createdAt` to `datospartido`...');
      await queryInterface.addColumn('datospartido', 'createdAt', {
        type: db.Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      });
      console.log('✓ Column `createdAt` added.');
    }

    if (!partidoDesc.lastRequestAt) {
      console.log('Adding column `lastRequestAt` to `datospartido`...');
      await queryInterface.addColumn('datospartido', 'lastRequestAt', {
        type: db.Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      });
      console.log('✓ Column `lastRequestAt` added.');
    }

    console.log('--- Safe additive update finished with 100% data preservation ---');
    process.exit(0);
  } catch (error) {
    console.error('Error during safe update:', error);
    process.exit(1);
  }
}

safeUpdate();
