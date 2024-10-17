const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../model");
const User = db.user;

// Middleware para verificar el token y extraer el userId
verifyToken = (req, res, next) => {
  let token = req.session.token;

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    req.userId = decoded.id; // Aquí se almacena el userId en el request
    next();
  });
};


// Nueva función para obtener el rol del usuario autenticado
getUserRole = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();

    if (roles.length > 0) {
      // Suponiendo que el usuario tiene un solo rol o tomamos el primer rol asignado
      const roleId = roles[0].id; // Toma el ID del rol principal
      req.userRoleId = roleId; // Guarda el ID del rol en el request

      next(); // Pasa al siguiente middleware o controlador
    } else {
      return res.status(404).send({
        message: "User has no roles!"
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: "Unable to retrieve user roles!",
    });
  }
};

// Middleware para verificar si el usuario es admin
isAdmin = async (req, res, next) => {
  
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "admin") {
        return next();
      }
    }

    return res.status(403).send({
      message: "Require Admin Role!",
    });
  } catch (error) {
    
    console.log(req.userId)
    return res.status(500).send({
      message: "Unable to validate User role!",
    });
  }
};

// Middleware para verificar si el usuario es moderador
isModerator = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "entrenador") {
        return next();
      }
    }

    return res.status(403).send({
      message: "Require Moderator Role!",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate Moderator role!",
    });
  }
};

// Middleware para verificar si el usuario es moderador o admin
isModeratorOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "entrenador" || roles[i].name === "admin") {
        return next();
      }
    }

    return res.status(403).send({
      message: "Require Moderator or Admin Role!",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate Moderator or Admin role!",
    });
  }
};
esAdmin=async(req,res,next)=>{
  try{
    const user = await User.findByPk(req.userId);
    console.log(user);
    return res.stats(403).send({
      message : "esAdmin funciona",
    })
  }
  catch(error){
    return res.status(500).send({
      message: "esAdmin no funciona!",
    });
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  isModeratorOrAdmin,
  esAdmin,
  getUserRole
};

module.exports = authJwt;
