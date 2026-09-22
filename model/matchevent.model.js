
module.exports = (sequelize, Sequelize) => {

    const matchevents = sequelize.define('matchevents', {
      matchId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
            model:'datospartido',
            key:'id'
        }
      },
      actionType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // timestamp of the event (full date + time, stored with seconds precision)
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      playerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
            model:'players',
            key:'player_id'
        }
      },
     scoreLocal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
     setsLocal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
     scoreVisitor: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
     setsVisitor: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
     eventId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
            model:'faulttypes',
            key:'id'
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
      tieneSaque: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
    
      
      }, {
        tableName: 'matchevents', // Especifica el nombre de la tabla si es diferente del nombre del modelo
        timestamps: false, // Desactiva los timestamps si no los necesitas
        indexes: [
          { fields: ['matchId'] },
          { fields: ['playerId'] }
        ]
      });
      matchevents.associate = function(models) {
        matchevents.belongsTo(models.user, {
          foreignKey: 'userId',
          as: 'user'
        });
        matchevents.belongsTo(models.faulttype, {
          foreignKey: 'eventId',
          as: 'event'
        });
        matchevents.belongsTo(models.players, {
          foreignKey: 'playerId',
          as: 'player'
        });
        matchevents.belongsTo(models.partido, {
          foreignKey: 'matchId',
          as: 'partido'
        });
      };
    return matchevents;
      };
    
    