"use strict";
module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define(
    "Media",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      url: DataTypes.STRING,
      game_id: DataTypes.INTEGER,
    },
    {
      tableName: "medias",
      underscored: true,
      timestamps: true,
    }
  );

  Media.associate = (models) => {
    Media.belongsTo(models.Game, { foreignKey: "game_id", as: "game" });
  };

  return Media;
};
