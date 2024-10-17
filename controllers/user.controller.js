const db = require("../model");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const Team = db.equipo;
const Op = db.Sequelize.Op;

exports.allAccess = (req, res) => {
    res.status(200).send("Public Content.");
  };
  
  exports.userBoard = (req, res) => {
    res.status(200).send("User Content.");
  };
  
  exports.adminBoard = (req, res) => {
    res.status(200).send("Admin Content.");
  };
  
  exports.moderatorBoard = (req, res) => {
    res.status(200).send("Moderator Content.");
  };
  exports.getUsers = async (req, res) => {
    console.log(req.userRoleId)
    try {
      // Buscar todos los usuarios con un rol cuyo ID sea menor o igual al del usuario autenticado
      const users = await User.findAll({
        include: [
          {
            model: Role,
            where: {
              id: {
                [Op.lt]: req.userRoleId, // Filtrar por roles con ID menor o igual al del usuario autenticado
              },
            },
          },
        ],
      });
  
      if (users.length > 0) {
        res.status(200).send(users);
      } else {
        res.status(404).send({ message: "No users with the same or lower role ID found!" });
      }
    } catch (error) {
      res.status(500).send({ message: error.message + "lol" });
    }
  };
  exports.updateUserRoles = async (req, res) => {
    try {
      // Obtener el usuario por ID (puedes cambiar a otro criterio si lo prefieres)
      const user = await User.findByPk(req.params.userId);
      
      if (!user) {
        return res.status(404).send({ message: "User Not Found." });
      }
  
      // Buscar los nuevos roles a asignar
      const newRoles = await Role.findAll({
        where: {
          name: {
            [Op.or]: req.body.roles // req.body.roles debe ser un array de roles
          }
        }
      });
  
      if (newRoles.length === 0) {
        return res.status(404).send({ message: "Roles Not Found." });
      }
  
      // Asignar los nuevos roles al usuario
      await user.setRoles(newRoles);
  
      return res.status(200).send({ message: "User roles updated successfully." });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  };

