"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserFavourite extends Model {
    static associate(models) {
      UserFavourite.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      UserFavourite.belongsTo(models.Game, {
        foreignKey: "game_id",
        as: "game",
      });
    }
  }

  UserFavourite.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: DataTypes.INTEGER,
      game_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "UserFavourite",
      tableName: "user_favourites",
      underscored: true,
      timestamps: true,
    }
  );

  return UserFavourite;
};
