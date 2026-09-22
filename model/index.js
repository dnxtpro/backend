const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
    config.DB,
    config.USER,
    config.PASSWORD,
    {
      host: config.HOST,
      port: config.PORT,
      dialect: config.dialect,
      logging: false,
      pool: {
        max: config.pool.max,
        min: config.pool.min,
        acquire: config.pool.acquire,
        idle: config.pool.idle
      }
    }
  );

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("../model/user.model.js")(sequelize, Sequelize);
db.role = require("../model/role.model.js")(sequelize, Sequelize);
db.partido = require("../model/partido.model.js")(sequelize, Sequelize);
db.positions = require("../model/positions.model.js")(sequelize, Sequelize);
db.players = require("../model/player.model.js")(sequelize, Sequelize);
db.faulttype = require("../model/faulttype.model.js")(sequelize,Sequelize);
db.matchevent=require("../model/matchevent.model.js")(sequelize,Sequelize);
db.equipo=require("../model/equipo.model.js")(sequelize,Sequelize);
db.annotations=require("../model/annotation.model.js")(sequelize,Sequelize);
db.anotaciones=require("../model/anotaciones.model.js")(sequelize,Sequelize);
db.rotaciones=require("../model/rotaciones.model.js")(sequelize,Sequelize);
db.reward = require("../model/reward.model.js")(sequelize, Sequelize);
db.pointslog = require("../model/pointslog.model.js")(sequelize, Sequelize);
db.rewardlog = require("../model/rewardlog.model.js")(sequelize, Sequelize);
db.actionRating = require("../model/actions_rating.model.js")(sequelize, Sequelize);
db.actionType = require("../model/actions_type.model.js")(sequelize, Sequelize);
db.actionRegister = require("../model/actions_register.model.js")(sequelize, Sequelize);
db.annotations.belongsTo(db.players, {foreignKey: 'player_id', as : 'jugador'})
db.annotations.belongsTo(db.matchevent, { foreignKey: 'matchEventId', as: 'evento' });

db.matchevent.hasMany(db.annotations, { foreignKey: 'matchEventId', as: 'annotations' });

// Relación para anotaciones de canvas/JSON
db.anotaciones.belongsTo(db.partido, { foreignKey: 'matchId', as: 'match' });
db.partido.hasMany(db.anotaciones, { foreignKey: 'matchId', as: 'anotaciones_canvas' });


db.partido.belongsTo(db.user, { foreignKey: 'id', as: 'user' });

db.partido.belongsTo(db.equipo, {foreignKey:'id'})

db.role.belongsToMany(db.user, {
  through: "user_roles",
  foreignKey: "roleId",  // Clave foránea para role en user_roles
  otherKey: "userId"     // Clave foránea para user en user_roles
});
db.user.belongsToMany(db.role, {
  through: "user_roles",
  foreignKey: "userId",  // Clave foránea para user en user_roles
  otherKey: "roleId"     // Clave foránea para role en user_roles
});
db.players.belongsToMany(db.equipo,{
  through:"player_team",
  foreignKey:"playerId",
  otherKey:"teamId"
});
db.equipo.belongsToMany(db.players,{
  through:"player_team",
  foreignKey:"teamId",
  otherKey:"playerId"
})



db.equipo.belongsToMany(db.user,{
  through: "user_teams",
  foreignKey:"teamId",
  otherKey:"userId",
  as: "equipa"  
}
);
db.user.belongsToMany(db.equipo,{
  through: "user_teams",
  foreignKey:"userId",
  otherKey:"teamId", 
  as: "useras"
});

db.partido.belongsTo(db.equipo,{foreignKey:'equipoId',as:'parequi'})

db.matchevent.belongsTo(db.faulttype,{foreignKey:'eventId',as:'event'}
) ;
db.matchevent.belongsTo(db.players,{foreignKey:'playerId',as:'player'}
) ;
db.matchevent.belongsTo(db.user,{foreignKey:'userId',as:'user'}
) ;
db.matchevent.belongsTo(db.partido,{foreignKey:'matchId',as:'partido'}
) ;
db.players.belongsTo(db.positions,{foreignKey:'position_id',as: 'position'});
db.players.belongsTo(db.equipo,{foreignKey:'equipoId',as:'equipo'});
db.players.belongsTo(db.user,{foreignKey:'mainUser',as:'ser'});
db.rewardlog.belongsTo(db.user, { foreignKey: 'userId', as: 'user' });
db.rewardlog.belongsTo(db.reward, { foreignKey: 'rewardId', as: 'reward' });

db.pointslog.belongsTo(db.user, { foreignKey: 'userId', as: 'user' });

db.user.hasMany(db.rewardlog, { foreignKey: 'userId', as: 'rewardLogs' });
db.user.hasMany(db.pointslog, { foreignKey: 'userId', as: 'pointsLogs' });
db.reward.hasMany(db.rewardlog, { foreignKey: 'rewardId', as: 'logs' });
db.actionRegister.belongsTo(db.actionType, { foreignKey: 'action_type_id', as: 'actionType' });
db.actionRegister.belongsTo(db.actionRating, { foreignKey: 'rating_id', as: 'actionRating' });
db.actionRegister.belongsTo(db.players, { foreignKey: 'player_id', as: 'player' });

db.playerTokens = require("../model/player_token.model.js")(sequelize, Sequelize);
db.surveys = require("../model/survey.model.js")(sequelize, Sequelize);
db.surveyQuestions = require("../model/survey_question.model.js")(sequelize, Sequelize);
db.surveyResponses = require("../model/survey_response.model.js")(sequelize, Sequelize);

// Associations for playerTokens
db.playerTokens.belongsTo(db.players, { foreignKey: 'player_id', as: 'player' });
db.players.hasMany(db.playerTokens, { foreignKey: 'player_id', as: 'tokens' });
db.playerTokens.belongsTo(db.user, { foreignKey: 'created_by', as: 'creator' });

// Associations for surveys
db.surveys.belongsTo(db.equipo, { foreignKey: 'equipoId', as: 'equipo' });
db.equipo.hasMany(db.surveys, { foreignKey: 'equipoId', as: 'surveys' });
db.surveys.belongsTo(db.user, { foreignKey: 'created_by', as: 'creator' });
db.surveys.belongsTo(db.players, { foreignKey: 'captain_player_id', as: 'captain' });

db.surveys.hasMany(db.surveyQuestions, { foreignKey: 'survey_id', as: 'questions', onDelete: 'CASCADE' });
db.surveyQuestions.belongsTo(db.surveys, { foreignKey: 'survey_id', as: 'survey' });

db.surveys.hasMany(db.surveyResponses, { foreignKey: 'survey_id', as: 'responses', onDelete: 'CASCADE' });
db.surveyResponses.belongsTo(db.surveys, { foreignKey: 'survey_id', as: 'survey' });
db.surveyResponses.belongsTo(db.players, { foreignKey: 'player_id', as: 'player' });
db.players.hasMany(db.surveyResponses, { foreignKey: 'player_id', as: 'surveyResponses' });
db.surveyResponses.belongsTo(db.user, { foreignKey: 'user_id', as: 'user' });

db.ROLES = ["user", "admin", "moderator", "entrenador"];

module.exports = db;