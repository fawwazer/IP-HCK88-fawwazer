"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserRecommendation extends Model {
    static associate(models) {
      UserRecommendation.belongsTo(models.UserFavourite, {
        foreignKey: "user_favourite_id",
        as: "favourite",
      });
      UserRecommendation.belongsTo(models.Game, {
        foreignKey: "game_id",
        as: "game",
      });
    }
  }

  UserRecommendation.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_favourite_id: DataTypes.INTEGER,
      game_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "UserRecommendation",
      tableName: "user_recommendations",
      underscored: true,
      timestamps: true,
    }
  );

  return UserRecommendation;
};
