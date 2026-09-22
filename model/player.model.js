
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
        allowNull: true,
      },
      position_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'positions',
          key: 'position_id'
        }
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      equipoId:{
        type: Sequelize.INTEGER,
        allowNull:false,
        references:{
          model: 'equipos',
          key:'id'
        }
      },
      mainUser:{
        type:Sequelize.INTEGER,
        allowNull:true,
        references:{
          model:'users',
          key:'id'
        }
      },
      apellidos: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PRESELECTED', 'INVITED', 'REGISTERED', 'ACTIVE', 'INACTIVE'),
        defaultValue: 'PRESELECTED',
        allowNull: false,
      },
      secondary_positions: {
        type: Sequelize.TEXT,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue('secondary_positions');
          return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
          this.setDataValue('secondary_positions', value ? JSON.stringify(value) : null);
        }
      },
      years_playing: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      player_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      coach_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      }
    
      }, {
        tableName: 'players', // Especifica el nombre de la tabla si es diferente del nombre del modelo
        timestamps: false, // Desactiva los timestamps si no los necesitas
        indexes: [
          { fields: ['equipoId'] },
          { fields: ['userId'] },
          { fields: ['mainUser'] }
        ]
      });
      players.associate = function(models) {
        // Relación con el modelo `user`
        players.belongsTo(models.user, {
          foreignKey: 'userId',
          as: 'user'
        });
        players.belongsTo(models.user, {
          foreignKey: 'mainUser',
          as: 'ser'  // Usando el alias 'ser'
        });
        
        // Relación con el modelo `positions`
        players.belongsTo(models.positions, {
          foreignKey: 'position_id',
          as: 'position'
        });
      };
  
    return players;
      };
    
    