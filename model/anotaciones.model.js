module.exports = (sequelize, Sequelize) => {
  const Anotaciones = sequelize.define(
    'anotaciones',
    {
      // Optional human-friendly id coming from client (e.g. "annotation-1762033451576")
      annotation_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: 'uq_anotaciones_annotation_id',
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      opacity: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 1,
      },
      strokeWidth: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      // store drawable data as TEXT (JSON string - compatible with older MySQL)
      data: {
        type: Sequelize.TEXT,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue('data');
          return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
          this.setDataValue('data', value ? JSON.stringify(value) : null);
        }
      },
      source: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      matchId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'datospartido',
          key: 'id',
        },
      },
      eventIndex: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      // optional brief human-entered description for the annotation
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'anotaciones',
      timestamps: true,
    }
  );

  return Anotaciones;
};
