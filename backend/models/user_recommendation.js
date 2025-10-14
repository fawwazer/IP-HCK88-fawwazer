"use strict";
module.exports = (sequelize, DataTypes) => {
  const UserRecommendation = sequelize.define(
    "UserRecommendation",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_favourite_id: DataTypes.INTEGER,
      game_id: DataTypes.INTEGER,
    },
    {
      tableName: "user_recommendations",
      underscored: true,
      timestamps: true,
    }
  );

  UserRecommendation.associate = (models) => {};
  return UserRecommendation;
};
