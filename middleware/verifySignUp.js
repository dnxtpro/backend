const db = require('../model');
const ROLES = db.ROLES;
const User = db.user;

checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // Username
    let user = await User.findOne({
      where: {
        username: req.body.username,
      },
    });

    if (user) {
      return res.status(400).send({
        message: 'Failed! Username is already in use!',
      });
    }

    // Email
    user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (user) {
      return res.status(400).send({
        message: 'Failed! Email is already in use!',
      });
    }

    next();
  } catch (error) {
    return res.status(500).send({
      message: 'Unable to validate Username!',
    });
  }
};

// B8: Added input validation for username, email and password at signup
checkSignupFields = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).send({ message: 'Username must be at least 3 characters.' });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).send({ message: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).send({ message: 'Password must be at least 8 characters.' });
  }

  next();
};

checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: 'Failed! Role does not exist = ' + req.body.roles[i],
        });
        return;
      }
    }
  }

  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
  checkSignupFields,
};

module.exports = verifySignUp;