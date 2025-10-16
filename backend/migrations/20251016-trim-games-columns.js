"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new 'released' column (if not exists) and copy from 'release_date' if present
    const tableInfo = await queryInterface.describeTable("games");
    if (!tableInfo.released) {
      await queryInterface.addColumn("games", "released", {
        type: Sequelize.DATE,
        allowNull: true,
      });
      if (tableInfo.release_date) {
        await queryInterface.sequelize.query(
          "UPDATE games SET released = release_date WHERE release_date IS NOT NULL"
        );
      }
    }

    // Remove columns we no longer want: rating_i_g_d_b, is_available, release_date, publisher, description, igdb_id
    const colsToRemove = [
      "rating_i_g_d_b",
      "is_available",
      "release_date",
      "publisher",
      "description",
      "igdb_id",
    ];
    for (const c of colsToRemove) {
      if (tableInfo[c]) {
        await queryInterface.removeColumn("games", c);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // In down we recreate the previous columns with basic types
    const tableInfo = await queryInterface.describeTable("games");
    if (!tableInfo.release_date) {
      await queryInterface.addColumn("games", "release_date", {
        type: Sequelize.DATE,
        allowNull: true,
      });
      await queryInterface.sequelize.query(
        "UPDATE games SET release_date = released WHERE released IS NOT NULL"
      );
    }
    const colsToAdd = {
      rating_i_g_d_b: { type: Sequelize.INTEGER },
      is_available: { type: Sequelize.BOOLEAN, defaultValue: false },
      publisher: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      igdb_id: { type: Sequelize.INTEGER, unique: true },
    };
    for (const [c, def] of Object.entries(colsToAdd)) {
      const info = await queryInterface.describeTable("games");
      if (!info[c]) {
        await queryInterface.addColumn("games", c, def);
      }
    }
    // remove 'released'
    const info2 = await queryInterface.describeTable("games");
    if (info2.released) await queryInterface.removeColumn("games", "released");
  },
};
