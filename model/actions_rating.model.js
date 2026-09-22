module.exports = (sequelize, Sequelize) => {
  const ActionRating = sequelize.define("action_ratings", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    action_type_id: { type: Sequelize.INTEGER, allowNull: false },
    symbol: { type: Sequelize.STRING(2), allowNull: false },
    label: { type: Sequelize.STRING(50), allowNull: false },
    description: { type: Sequelize.TEXT }
  });

  return ActionRating;
};
