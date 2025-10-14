"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    static associate(models) {
      Game.hasMany(models.Media, { foreignKey: "game_id", as: "medias" });
      Game.hasMany(models.Genre, { foreignKey: "game_id", as: "genres" });
      Game.hasMany(models.Theme, { foreignKey: "game_id", as: "themes" });
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
      igdb_id: { type: DataTypes.INTEGER, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
      ratingIGDB: DataTypes.INTEGER,
      is_available: { type: DataTypes.BOOLEAN, defaultValue: false },
      release_date: DataTypes.DATE,
      publisher: DataTypes.STRING,
      description: DataTypes.TEXT,
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
