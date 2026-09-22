module.exports = (sequelize, Sequelize) => {
  const SurveyResponse = sequelize.define('survey_responses', {
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
    player_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'players',
        key: 'player_id'
      }
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: Sequelize.ENUM('DRAFT', 'SUBMITTED'),
      defaultValue: 'DRAFT',
      allowNull: false
    },
    answers: {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '{}',
      get() {
        const rawValue = this.getDataValue('answers');
        if (!rawValue) return {};
        try {
          return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
        } catch (e) {
          return {};
        }
      },
      set(value) {
        this.setDataValue('answers', typeof value === 'string' ? value : JSON.stringify(value || {}));
      }
    },
    submitted_at: {
      type: Sequelize.DATE,
      allowNull: true
    }
  }, {
    tableName: 'survey_responses',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['survey_id', 'player_id'],
        name: 'unique_survey_player_response'
      },
      { fields: ['survey_id'] },
      { fields: ['player_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] }
    ]
  });

  return SurveyResponse;
};
