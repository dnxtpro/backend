module.exports = (sequelize, Sequelize) => {
  const ActionRegister = sequelize.define("action_registers", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    match_id: { type: Sequelize.INTEGER, allowNull: false },
    set_number: { type: Sequelize.INTEGER, allowNull: true },
    player_id: { type: Sequelize.INTEGER },
    team_id: { type: Sequelize.INTEGER, allowNull: false },
    action_type_id: { type: Sequelize.INTEGER, allowNull: false },
    rating_id: { type: Sequelize.INTEGER, allowNull: false },
    timestamp_in_set: { type: Sequelize.FLOAT, allowNull: false },
    rally_number: { type: Sequelize.INTEGER }
  }, {
    timestamps: false,
    indexes: [
      { fields: ['match_id'] },
      { fields: ['player_id'] }
    ]
  });



  return ActionRegister;
};