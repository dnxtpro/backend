'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Modificar tabla players para añadir columnas nuevas y permitir nulos en dorsal/position_id
    const tableDesc = await queryInterface.describeTable('players');

    if (!tableDesc.apellidos) {
      await queryInterface.addColumn('players', 'apellidos', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    if (!tableDesc.status) {
      await queryInterface.addColumn('players', 'status', {
        type: Sequelize.ENUM('PRESELECTED', 'INVITED', 'REGISTERED', 'ACTIVE', 'INACTIVE'),
        defaultValue: 'PRESELECTED',
        allowNull: false
      });
    }

    if (!tableDesc.secondary_positions) {
      await queryInterface.addColumn('players', 'secondary_positions', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!tableDesc.years_playing) {
      await queryInterface.addColumn('players', 'years_playing', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

    if (!tableDesc.player_notes) {
      await queryInterface.addColumn('players', 'player_notes', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!tableDesc.coach_notes) {
      await queryInterface.addColumn('players', 'coach_notes', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    await queryInterface.changeColumn('players', 'dorsal', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.changeColumn('players', 'position_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // 2. Crear tabla player_tokens
    await queryInterface.createTable('player_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'players',
          key: 'player_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      token_hash: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('INVITATION', 'RECOVERY'),
        defaultValue: 'INVITATION',
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('player_tokens', ['token_hash']);
    await queryInterface.addIndex('player_tokens', ['player_id']);
    await queryInterface.addIndex('player_tokens', ['type']);

    // 3. Crear tabla surveys
    await queryInterface.createTable('surveys', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      equipoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'equipos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'OPEN', 'CLOSED'),
        defaultValue: 'DRAFT',
        allowNull: false
      },
      results_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      captain_player_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'players',
          key: 'player_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      opens_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      closes_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('surveys', ['equipoId']);
    await queryInterface.addIndex('surveys', ['status']);

    // 4. Crear tabla survey_questions
    await queryInterface.createTable('survey_questions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      survey_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'surveys',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM(
          'SHORT_TEXT',
          'LONG_TEXT',
          'SINGLE_CHOICE',
          'MULTIPLE_CHOICE',
          'SCALE',
          'YES_NO',
          'RANKING'
        ),
        allowNull: false
      },
      required: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      options: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      config: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('survey_questions', ['survey_id']);
    await queryInterface.addIndex('survey_questions', ['order']);

    // 5. Crear tabla survey_responses
    await queryInterface.createTable('survey_responses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      survey_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'surveys',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'players',
          key: 'player_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'SUBMITTED'),
        defaultValue: 'DRAFT',
        allowNull: false
      },
      answers: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('survey_responses', ['survey_id', 'player_id'], {
      unique: true,
      name: 'unique_survey_player_response'
    });
    await queryInterface.addIndex('survey_responses', ['survey_id']);
    await queryInterface.addIndex('survey_responses', ['player_id']);
    await queryInterface.addIndex('survey_responses', ['user_id']);
    await queryInterface.addIndex('survey_responses', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('survey_responses');
    await queryInterface.dropTable('survey_questions');
    await queryInterface.dropTable('surveys');
    await queryInterface.dropTable('player_tokens');
    await queryInterface.removeColumn('players', 'coach_notes');
    await queryInterface.removeColumn('players', 'player_notes');
    await queryInterface.removeColumn('players', 'years_playing');
    await queryInterface.removeColumn('players', 'secondary_positions');
    await queryInterface.removeColumn('players', 'status');
    await queryInterface.removeColumn('players', 'apellidos');
  }
};
