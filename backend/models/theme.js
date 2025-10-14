"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Theme extends Model {
    static associate(models) {
      Theme.belongsTo(models.Game, { foreignKey: "game_id", as: "game" });
    }
  }

  Theme.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      game_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Theme",
      tableName: "themes",
      underscored: true,
      timestamps: true,
    }
  );

  return Theme;
};
