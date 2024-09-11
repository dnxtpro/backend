module.exports = (sequelize,Sequelize) =>{
    const faulttypes = sequelize.define('faulttypes',{
        type:{
            type:Sequelize.STRING,
            allowNull:false,
        },
        isSuccess:{
            type:Sequelize.INTEGER,
            allowNull:false,
        }

    
},{
    tableName: 'faulttypes', // Especifica el nombre de la tabla si es diferente del nombre del modelo
    timestamps: false // Desactiva los timestamps si no los necesitas
  })
    return faulttypes;
}