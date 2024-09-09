
module.exports = (sequelize, Sequelize) => {

    const players = sequelize.define('players', {

      player_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
      player_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
     
      dorsal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      position_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'posiciones', // Nombre de la tabla a la que se refiere
          key: 'position_id'       // Columna de la tabla referenciada
        }
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Nombre de la tabla a la que se refiere
          key: 'id'       // Columna de la tabla referenciada
        }
    
      },
    
      }, {
        tableName: 'players', // Especifica el nombre de la tabla si es diferente del nombre del modelo
        timestamps: false // Desactiva los timestamps si no los necesitas
      });
      players.associate = function(models) {
        // Relación con el modelo `user`
        players.belongsTo(models.user, {
          foreignKey: 'userId',
          as: 'user'
        });
        
        // Relación con el modelo `positions`
        players.belongsTo(models.positions, {
          foreignKey: 'position_id',
          as: 'position'
        });
      };
  
    return players;
      };
    
    