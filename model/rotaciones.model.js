module.exports = (sequelize, Sequelize) => {
  const rotaciones = sequelize.define(
    "rotaciones",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "rotaciones", // Especifica el nombre de la tabla si es diferente del nombre del modelo
      timestamps: false, // Desactiva los timestamps si no los necesitas
    }
  );

  return rotaciones;
};
