"use strict";
module.exports = (sequelize, DataTypes) => {
  const Genre = sequelize.define(
    "Genre",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      game_id: DataTypes.INTEGER,
    },
    {
      tableName: "genres",
      underscored: true,
      timestamps: true,
    }
  );

  Genre.associate = (models) => {
    Genre.belongsTo(models.Game, { foreignKey: "game_id", as: "game" });
  };

  return Genre;
};
