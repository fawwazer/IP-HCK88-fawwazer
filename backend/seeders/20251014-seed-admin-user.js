"use strict";
const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
    const hashed = await bcrypt.hash(password, 10);

    return queryInterface.bulkInsert(
      "users",
      [
        {
          name: "Admin",
          email,
          password: hashed,
          role: "admin",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    return queryInterface.bulkDelete("users", { email }, {});
  },
};
