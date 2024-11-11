const db = require("../model");
const Equipo = db.equipo;
const User = db.user;
const player = db.players;

const { QueryTypes } = require('sequelize');
const sequelize = db.sequelize;

exports.equipo = async (req, res) => {
  const nombre = req.body.team;
  const userId = req.userId;

  console.log(nombre);
  try {
      // Crear el equipo
      const equipo = await Equipo.create({ nombre: nombre });
      
      if (equipo) {
          // Asociar el equipo al usuario
          await equipo.addUser(userId);

          if(equipo.id ){
           console.log(equipo.id,'hoas')
           player.create({
              player_name: 'Rival',
              dorsal: 0,
              position_id: 1, // La posición con id 1
              userId: userId, // Usamos el userId del request
              equipoId: equipo.id // Tomamos el id del equipo creado
          });
          res.status(200).json(equipo);
        }

         else{  res.status(200).json(equipo);}
        
      } else {
          res.status(500).json({ error: 'No se pudo crear el equipo' });
      }
  } catch (error) {
      res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};
exports.obtenerEquipo = async (req, res) => {
  const userId = req.userId;

  try {
      const user = await User.findByPk(userId, {
          include: {
              model: Equipo,
              as: 'useras' // Use the alias defined in the association
          }
      });

      if (!user) {
          return res.status(404).send({ message: "User not found." });
      }

      // Access the associated teams through `useras` and return them
      res.status(200).send(user.useras);
  } catch (error) {
      console.error("Error al obtener equipos:", error);
      res.status(500).send({ error: 'Internal Server Error' });
  }
};

exports.obtenerEquipos = async (req,res)=>{
    
    const equipos = await Equipo.findAll();
      
      res.status(200).send(equipos);
}