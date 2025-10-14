"use strict";
module.exports = (sequelize, DataTypes) => {
  const Theme = sequelize.define(
    "Theme",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      game_id: DataTypes.INTEGER,
    },
    {
      tableName: "themes",
      underscored: true,
      timestamps: true,
    }
  );

  Theme.associate = (models) => {
    Theme.belongsTo(models.Game, { foreignKey: "game_id", as: "game" });
  };

  return Theme;
};
