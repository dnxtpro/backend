module.exports = (sequelize, Sequelize) => {
  const PlayerToken = sequelize.define('player_tokens', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    player_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'players',
        key: 'player_id'
      }
    },
    token_hash: {
      type: Sequelize.STRING(64),
      allowNull: false,
      comment: 'SHA-256 hash of the plain invitation/recovery token'
    },
    type: {
      type: Sequelize.ENUM('INVITATION', 'RECOVERY'),
      defaultValue: 'INVITATION',
      allowNull: false
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    used_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    revoked_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    created_by: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'player_tokens',
    timestamps: true,
    indexes: [
      { fields: ['token_hash'] },
      { fields: ['player_id'] },
      { fields: ['type'] }
    ]
  });

  return PlayerToken;
};
