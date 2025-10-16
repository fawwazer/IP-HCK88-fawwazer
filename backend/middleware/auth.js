const { verifyToken } = require("../helpers/jwt");
const { User } = require("../models");

module.exports = async function authentication(req, res, next) {
  const bearerToken = req.headers.authorization;
  if (!bearerToken) {
    throw { name: "JsonWebTokenError", message: "Invalid token" };
  }

  try {
    const access_token = bearerToken.split(" ")[1];

    const data = verifyToken(access_token);

    const user = await User.findByPk(data.id);
    if (!user) {
      throw { name: "JsonWebTokenError", message: "Invalid token" };
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
