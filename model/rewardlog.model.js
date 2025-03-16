module.exports = (sequelize, Sequelize) => {
    const RewardLog = sequelize.define('reward_log', {
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
      rewardId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'reward',
          key: 'id'
        }
      },
      dateClaimed: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    }, {
      timestamps: false
    });
  
    return RewardLog;
  };