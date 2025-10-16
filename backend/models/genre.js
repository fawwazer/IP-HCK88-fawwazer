"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Genre extends Model {
    static associate(models) {
      Genre.belongsTo(models.Game, { foreignKey: "game_id", as: "game" });
    }
  }

  Genre.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      rawg_genre_id: { type: DataTypes.INTEGER, unique: true },
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      game_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Genre",
      tableName: "genres",
      underscored: true,
      timestamps: true,
    }
  );

  return Genre;
};
