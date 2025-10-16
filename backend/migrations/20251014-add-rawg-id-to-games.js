"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("games", "rawg_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("games", "rawg_id");
  },
};
