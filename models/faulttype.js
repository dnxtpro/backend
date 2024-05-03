const pool = require('../config/db'); // Ajusta la ruta según tu estructura de carpetas

const FaultType = {
  getFaultTypes: (callback) => {
    const query = 'SELECT * FROM faulttypes';

    pool.query(query, (error, results) => {
      if (error) {
        console.error("Error al obtener tipos de fallos:", error);
        return callback(error, null);
      } else {
        callback(null, results);
      }
    });
  }
};

module.exports = FaultType;