const { verifySignUp, validateSchema } = require("../middleware");
const controller = require("../controllers/auth.controller");
const authJwt = require("../middleware/authJwt.js");
const { signupSchema, signinSchema } = require("../schemas/auth.schema");
module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    [
      validateSchema(signupSchema),
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted,
    ],
    controller.signup
  );

  app.post("/api/auth/signin", validateSchema(signinSchema), controller.signin);

  app.post("/api/auth/signout", controller.signout);
};