const { comparePasswords } = require("../helpers/bcrypt");
const { generateToken } = require("../helpers/jwt");
const { User } = require("../models");
const { OAuth2Client } = require("google-auth-library");

// initialize Google OAuth2 client using the Client ID stored in env
const client = new OAuth2Client(
  process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_CLIENT_ID
);
class userController {
  static async register(req, res, next) {
    try {
      const user = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        role: "User",
      });
      res.status(201).json({ id: user.id, email: user.email });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const isPasswordValid = comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const token = generateToken({ id: user.id });
      res.status(200).json({ token });
    } catch (error) {
      next(error);
    }
  }

  static async goggleLogin(req, res, next) {
    try {
      const { id_token } = req.body;
      if (!id_token) {
        return res.status(400).json({ error: "id_token is required" });
      }
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_API_KEY,
      });
      const { name, email } = ticket.getPayload();
      let user = await User.findOne({ where: { email } });
      if (!user) {
        user = await User.create({
          name,
          email,
          password: Math.random().toString(36).slice(-8),
          role: "User",
        });
      }
      const token = generateToken({ id: user.id });
      res.status(200).json({ token });
    } catch (error) {
      console.error(
        "Google login error:",
        error && error.message ? error.message : error
      );
      next(error);
    }
  }
}
module.exports = userController;
