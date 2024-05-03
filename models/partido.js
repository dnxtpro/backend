const pool = require('../config/db');

const Partido = {
  create: (datosPartido, callback) => {
    pool.query('INSERT INTO DatosPartido SET ?', datosPartido, (error, results) => {
      if (error) {
        console.error("Error en create (Partido):", error);
        return callback(error, null);
      } else {
        callback(null, results);
      }
    });
  },
  getMatches: (callback) => {
    console.log('llamada recibida')
    const sql = 'SELECT * FROM DatosPartido';
    pool.query(sql, (error, results) => {
      if (error) {
        console.error("Error al obtener los datos de los partidos:", error);
        return callback(error, null);
      }

      if (results.length === 0) {
        console.log("No se encontraron datos de los partidos");
        return callback(null, []);
      } else {
        callback(null, results);
      }
    });
  },
};

module.exports = Partido;
