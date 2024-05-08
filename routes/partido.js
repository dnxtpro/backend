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

router.get('/create-match/getMatches', (req, res) => {
  Partido.getMatches((error, results) => {
    if (error) {
      console.error("Error al obtener los partidos:", error);
      res.status(500).json({ error: 'Error al obtener los partidos' });
    } else {
      res.status(200).json(results);
    }
  });
});

// Ruta para crear un nuevo partido
router.post('/create-match', (req, res) => {
  console.log('Datos recibidos:', req.body); // Agrega este console.log para mostrar los datos recibidos

  const { rivalTeam, date, location } = req.body;

  const query = 'INSERT INTO DatosPartido SET ?';

  const partidoData = {
    rivalTeam,
    date,
    location,
  };

  pool.query(query, partidoData, (error, results) => {
    if (error) {
      console.error('Error al crear partido:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('Partido creado con éxito:', results);
      res.status(201).json(results);
    }
  });
});
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

router.get('/matchevents/:matchId', (req, res) => {
  const matchId = req.params.matchId;
  console.log('matchId recibido en el servidor:', matchId);

  MatchEvent.getByMatchId(matchId, (error, events) => {
    if (error) {
      console.error("Error al obtener eventos del partido:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log("Eventos del partido recuperados con éxito:", events);
      res.json(events);
    }
  });
});
router.get('/ultimoseventos/:match1Id',(req,res)=>{
  const matchId = req.params.match1Id;
  console.log('matchId recibido',matchId);
  MatchEvent.ultimoseventos(matchId,(error,events)=>{
    if (error) {
      console.error("Error al obtener eventos del partido:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log("Eventos del partido recuperados con éxito:", events);  
      res.json(events);
    }
  });
});


module.exports = router;
