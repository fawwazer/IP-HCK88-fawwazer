const { verifyToken } = require("../helpers/jwt");
const { User } = require("../models");

module.exports = async function authentication(req, res, next) {
  try {
    const bearerToken = req.headers.authorization;
    if (!bearerToken) {
      // forward as an error to the express error handler instead of throwing synchronously
      return next({ name: "JsonWebTokenError", message: "Invalid token" });
    }

    const access_token = bearerToken.split(" ")[1];
    const data = verifyToken(access_token);

    if (!data || !data.id) {
      return next({ name: "JsonWebTokenError", message: "Invalid token" });
    }

    const user = await User.findByPk(data.id);
    if (!user) {
      return next({ name: "JsonWebTokenError", message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
