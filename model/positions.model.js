
module.exports = (sequelize, Sequelize) => {

    const positions = sequelize.define('positions', {
        position_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
      position_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    
      }, {
        tableName: 'positions', // Especifica el nombre de la tabla si es diferente del nombre del modelo
        timestamps: false // Desactiva los timestamps si no los necesitas
      });
  
    return positions;
      };
    
    