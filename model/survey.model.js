module.exports = (sequelize, Sequelize) => {
  const Survey = sequelize.define('surveys', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
      }
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
      }
    },
    created_by: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    opens_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    closes_at: {
      type: Sequelize.DATE,
      allowNull: true
    }
  }, {
    tableName: 'surveys',
    timestamps: true,
    indexes: [
      { fields: ['equipoId'] },
      { fields: ['status'] }
    ]
  });

  return Survey;
};
