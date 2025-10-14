"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Media extends Model {
    static associate(models) {
      Media.belongsTo(models.Game, { foreignKey: "game_id", as: "game" });
    }
  }

  Media.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      url: DataTypes.STRING,
      game_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Media",
      tableName: "medias",
      underscored: true,
      timestamps: true,
    }
  );

  return Media;
};
