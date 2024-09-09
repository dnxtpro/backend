
module.exports = (sequelize, Sequelize) => {

const datosPartido = sequelize.define('datospartido', {
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
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // Nombre de la tabla a la que se refiere
      key: 'id'       // Columna de la tabla referenciada
    }
  }

  }, {
    tableName: 'datospartido', // Especifica el nombre de la tabla si es diferente del nombre del modelo
    timestamps: false // Desactiva los timestamps si no los necesitas
  });
  datosPartido.associate = function(models) {
    datosPartido.belongsTo(models.user, {
      foreignKey: 'userId',
      as: 'user'
    });
  };
return datosPartido;
  };

