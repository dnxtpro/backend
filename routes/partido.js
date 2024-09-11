// routes/partidos.js

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const Partido = require('../models/partido');
const MatchEvent = require('../models/matchevent');



router.get('/marcador', (req, res) => {
  const query = 'SELECT scoreLocal, scoreVisitor, setsLocal, setsVisitor FROM matchevents ORDER BY id DESC LIMIT 1';
  pool.query(query, (error, results) => {
    if (error) {
      console.error("Error al obtener los detalles del partido más reciente:", error);
      res.status(500).json({ error: 'Error al obtener elmarcador' });
    } else {
      res.status(200).json(results[0]);
      console.log('score:',results)
    }
  });
});
router.get('/latest-match-details', (req, res) => {
  const query = 'SELECT * FROM DatosPartido ORDER BY id DESC LIMIT 1';

  pool.query(query, (error, results) => {
    if (error) {
      console.error("Error al obtener los detalles del partido más reciente:", error);
      res.status(500).json({ error: 'Error al obtener los detalles del partido más reciente' });
    } else {
      res.status(200).json(results[0]);
    }
  });
});


// Ruta para crear un nuevo partido

router.get('/match-details/:matchId', (req, res) => {
  const matchId = req.params.matchId;

  Partido.getMatchDetails(matchId, (error, matchDetails) => {
    if (error) {
      console.error("Error al obtener detalles del partido:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(matchDetails);
    }
  });
});




module.exports = router;
