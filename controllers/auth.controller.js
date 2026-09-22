  
const db = require("../model");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const Team = db.equipo;

const Op = db.Sequelize.Op;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res, next) => {
  console.log(req.body, 'lo que quiero que metas tio')
  try {
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      
    });

    if (req.body.roles) {
      console.log(req.body.roles)
      const roles = await Role.findAll({
        where: {
          name: {
            [Op.or]: req.body.roles,
          },
        },
      });
      const result = user.setRoles(roles);
      if (result){ 
      
        res.send({ message: "User registered successfully with ROLE but no team!" });   
    }
     
    } else {
      // user has role = 1
      const result = user.setRoles([1]);
      if (result) {
       
          res.send({ message: "User registered successfully with default ROLE but no team!" });
        }
    }
  } catch (error) {
    next(error);
  }
};

exports.signin = async (req, res, next) => {
  try {
    const identifier = req.body.username || req.body.email;
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: identifier },
          { email: identifier }
        ]
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Invalid Password!",
      });
    }

    const token = jwt.sign({ id: user.id },
                           config.secret,
                           {
                            algorithm: 'HS256',
                            allowInsecureKeySizes: true,
                            expiresIn: 86400, // 24 hours
                           });

    let authorities = [];
    const roles = await user.getRoles();
    for (let i = 0; i < roles.length; i++) {
      authorities.push("ROLE_" + roles[i].name.toUpperCase());
    }

    req.session.token = token;

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      token: token
    });
  } catch (error) {
    next(error);
  }
};

exports.signout = async (req, res, next) => {
  try {
    req.session = null;
    res.clearCookie('jwt');
    return res.status(200).send({
      message: "You've been signed out!"
    });
  } catch (error) {
    next(error);
  }
};

