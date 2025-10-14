"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      email: { type: DataTypes.STRING, unique: true },
      password: DataTypes.STRING,
      role: DataTypes.STRING,
    },
    {
      tableName: "users",
      underscored: true,
      timestamps: true,
    }
  );

  User.associate = (models) => {};
  return User;
};
