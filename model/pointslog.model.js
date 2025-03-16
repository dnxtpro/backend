module.exports = (sequelize, Sequelize) => {
    const PointsLog = sequelize.define('points_log', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dateAwarded: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    }, {
      timestamps: false
    });
  
    return PointsLog;
  };