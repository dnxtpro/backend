const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const MatchEvent = require('../models/matchEvent');
const FaultType = require('../models/faultType');
const httpServer = require('http').createServer(); 
const {WebSocketServer} = require('ws');
const wss=new WebSocketServer({server:httpServer});


// Ruta para crear un nuevo evento del partido
router.post('/match-events', (req, res) => {
  const matchEventData = req.body.matchEventData;
  console.log('Datos recibidos desde Angular:', matchEventData);    

  MatchEvent.create(matchEventData, (error, results) => {
    if (error) {
      console.error("Error al crear evento del partido:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('Evento del partido creado con éxito:', results);
      res.status(201).json(results);

    }
  });
});
router.get('/matchevent/getLatest', (req, res) => {
  // Call the getLatest method from the MatchEvent model
  MatchEvent.getLatest((error, latestData) => {
    if (error) {
      console.error("Error al obtener los últimos datos del partido:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (!latestData) {
      console.log("No se encontraron datos de eventos del partido");
      res.status(404).json({ message: 'No match event data found' });
    } else {
      console.log("Últimos datos del partido recuperados con éxito:", latestData);
      res.json(latestData);
    }
  });
});
router.delete('/matchevent/delete-last', (req, res) => {
  const matchId = req.query.matchId;
  console.log('matchId recibido en el backend:', matchId);

  MatchEvent.deleteLastEvent(matchId, (error, result) => {
    if (error) {
      console.error("Error al borrar el último evento del partido:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (result.affectedRows === 0) {
      console.log("No se encontró el último evento para borrar");
      res.status(404).json({ message: 'No matching event found for deletion' });
    } else {
      console.log("Último evento del partido borrado con éxito");
      res.json({ message: 'Last match event deleted successfully' });
    }
  });
});
router.get('/fault-types', (req, res) => {
  FaultType.getFaultTypes((error, results) => {
    if (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

module.exports = router;
