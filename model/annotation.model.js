module.exports = (sequelize, Sequelize) => {
    const Annotation = sequelize.define("annotation", {
      nombre: {
        type: Sequelize.STRING
      },
      playerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
            model:'players',
            key:'player_id'
        }
      },
      matchEventId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
            model:'matchevents',
            key:'id'
        }
      },
    });
    
  
    return Annotation;
  };