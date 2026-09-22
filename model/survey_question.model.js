module.exports = (sequelize, Sequelize) => {
  const SurveyQuestion = sequelize.define('survey_questions', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    survey_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'surveys',
        key: 'id'
      }
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    type: {
      type: Sequelize.ENUM(
        'SHORT_TEXT',
        'LONG_TEXT',
        'SINGLE_CHOICE',
        'MULTIPLE_CHOICE',
        'SCALE',
        'YES_NO',
        'RANKING'
      ),
      allowNull: false
    },
    required: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    order: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    options: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Array of option choices for single, multiple choice, or ranking',
      get() {
        const rawValue = this.getDataValue('options');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('options', value ? JSON.stringify(value) : null);
      }
    },
    config: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Special config like min, max, minLabel, maxLabel for scale',
      get() {
        const rawValue = this.getDataValue('config');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('config', value ? JSON.stringify(value) : null);
      }
    }
  }, {
    tableName: 'survey_questions',
    timestamps: true,
    indexes: [
      { fields: ['survey_id'] },
      { fields: ['order'] }
    ]
  });

  return SurveyQuestion;
};
