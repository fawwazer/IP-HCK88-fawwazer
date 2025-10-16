"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("genres");
    if (!tableInfo.rawg_genre_id) {
      await queryInterface.addColumn("genres", "rawg_genre_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("genres");
    if (tableInfo.rawg_genre_id) {
      await queryInterface.removeColumn("genres", "rawg_genre_id");
    }
  },
};
