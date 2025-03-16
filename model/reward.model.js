module.exports = (sequelize, Sequelize) => {
    const Reward = sequelize.define('reward', {
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
      pointsRequired: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    }, {
      timestamps: false
    });
  
    return Reward;
  };