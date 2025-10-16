"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    static associate(models) {
      Game.hasMany(models.Media, { foreignKey: "game_id", as: "medias" });
      Game.hasMany(models.Genre, { foreignKey: "game_id", as: "genres" });
      Game.hasMany(models.UserFavourite, {
        foreignKey: "game_id",
        as: "favourited_by",
      });
      Game.hasMany(models.UserRecommendation, {
        foreignKey: "game_id",
        as: "recommendations",
      });
    }
  }

  Game.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      rawg_id: { type: DataTypes.INTEGER, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
      imageUrl: { type: DataTypes.STRING, field: "image_url" },
      released: { type: DataTypes.DATE, field: "released" },
    },
    {
      sequelize,
      modelName: "Game",
      tableName: "games",
      underscored: true,
      timestamps: true,
    }
  );

  return Game;
};
