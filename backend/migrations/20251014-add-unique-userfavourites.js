"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('user_favourites', {
      fields: ['user_id', 'game_id'],
      type: 'unique',
      name: 'uq_user_favourites_user_game'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('user_favourites', 'uq_user_favourites_user_game');
  }
};
