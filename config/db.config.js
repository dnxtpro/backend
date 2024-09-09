module.exports = {
    HOST: "localhost",
    USER: "dnxtpro",
    PASSWORD: "locoplaya",
    DB: "appstats",
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };