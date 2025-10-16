const { UserFavourite } = require("../models");

async function guardUser(req, res, next) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Admins are allowed
    if (user.role === "Admin") return next();

    // If a target user id is provided (query/params/body), allow if it's the same user
    const targetUserId = Number(
      req.query.user_id || req.params.userId || req.body.user_id || req.user.id
    );
    if (targetUserId && targetUserId === user.id) return next();

    // If deleting by gameId, allow if the favourite belongs to the authenticated user
    if (req.params.gameId) {
      const fav = await UserFavourite.findOne({
        where: { user_id: user.id, game_id: Number(req.params.gameId) },
      });
      if (fav) return next();
    }

    return res.status(403).json({ message: "Forbidden" });
  } catch (error) {
    next(error);
  }
}

module.exports = guardUser;
