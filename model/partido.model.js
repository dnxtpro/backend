module.exports = (sequelize, Sequelize) => {
  const datosPartido = sequelize.define(
    "datospartido",
    {
      equipo_local: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      rivalTeam: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // nuevo campo para almacenar el id de YouTube (opcional)
      youtubeId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users", // Nombre de la tabla a la que se refiere
          key: "id", // Columna de la tabla referenciada
        },
      },

      equipoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          // corregido 'refernces' -> 'references'
          model: "equipos",
          key: "id",
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      lastRequestAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "datospartido", // Especifica el nombre de la tabla si es diferente del nombre del modelo
      timestamps: false, // Desactiva los timestamps si no los necesitas
      indexes: [
        { fields: ['equipoId'] },
        { fields: ['userId'] }
      ]
    }
  );
  datosPartido.associate = function (models) {
    datosPartido.belongsTo(models.user, {
      foreignKey: "userId",
      as: "user",
    });
  };
  return datosPartido;
};
