const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
    config.DB,
    config.USER,
    config.PASSWORD,
    {
      host: config.HOST,
      dialect: config.dialect,
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
  otherKey:"userId"
}
);
db.user.belongsToMany(db.equipo,{
  through: "user_teams",
  foreignKey:"userId",
  otherKey:"teamId", 
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
db.players.belongsTo(db.user,{foreignKey:'mainUser',as:'ser'})

db.ROLES = ["user", "admin", "entrenador"];

module.exports = db;