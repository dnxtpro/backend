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


db.partido.belongsTo(db.user, { foreignKey: 'id', as: 'user' });
db.role.belongsToMany(db.user, {
  through: "user_roles"
});
db.user.belongsToMany(db.role, {
  through: "user_roles"
});
db.players.belongsTo(db.positions,{foreignKey:'position_id',as: 'position'})

db.ROLES = ["user", "admin", "moderator"];

module.exports = db;