// models/faulttype.model.js
module.exports = (sequelize, DataTypes) => {
  const FaultType = sequelize.define('FaultType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isSuccess: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    tableName: 'faulttypes',
    timestamps: false
  });

  return FaultType;
};
