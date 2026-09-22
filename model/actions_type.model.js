module.exports = (sequelize, Sequelize) => {
  const ActionType = sequelize.define("action_types", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: Sequelize.STRING(5),
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
  });

  return ActionType;
};
