"use strict";
module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define(
    "Game",
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
      tableName: "games",
      underscored: true,
      timestamps: true,
    }
  );

  Game.associate = (models) => {
    Game.hasMany(models.Media, { foreignKey: "game_id", as: "medias" });
    Game.hasMany(models.Genre, { foreignKey: "game_id", as: "genres" });
    Game.hasMany(models.Theme, { foreignKey: "game_id", as: "themes" });
  };

  return Game;
};
