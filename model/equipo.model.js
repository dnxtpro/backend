module.exports = (sequelize, Sequelize) => {
    const Equipo = sequelize.define("equipo", {
      nombre: {
        type: Sequelize.STRING
      },
    });
  
    return Equipo;
  };