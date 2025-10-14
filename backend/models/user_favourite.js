"use strict";
module.exports = (sequelize, DataTypes) => {
  const UserFavourite = sequelize.define(
    "UserFavourite",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: DataTypes.INTEGER,
      game_id: DataTypes.INTEGER,
    },
    {
      tableName: "user_favourites",
      underscored: true,
      timestamps: true,
    }
  );

  UserFavourite.associate = (models) => {};
  return UserFavourite;
};
