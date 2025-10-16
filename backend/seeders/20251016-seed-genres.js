"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const genres = [
      {
        rawg_genre_id: 4,
        name: "Action",
        description: "Game dengan fokus pada tantangan fisik",
      },
      {
        rawg_genre_id: 51,
        name: "Indie",
        description: "Game independen yang dikembangkan oleh studio kecil",
      },
      {
        rawg_genre_id: 3,
        name: "Adventure",
        description: "Game dengan penekanan pada cerita dan eksplorasi",
      },
      { rawg_genre_id: 5, name: "RPG", description: "Role-playing games" },
      {
        rawg_genre_id: 10,
        name: "Strategy",
        description: "Game yang membutuhkan perencanaan dan taktik",
      },
      {
        rawg_genre_id: 2,
        name: "Shooter",
        description: "Game tembak-menembak",
      },
      {
        rawg_genre_id: 40,
        name: "Casual",
        description: "Game santai dan mudah dimainkan",
      },
      {
        rawg_genre_id: 14,
        name: "Simulation",
        description: "Game simulasi kehidupan nyata",
      },
      { rawg_genre_id: 7, name: "Puzzle", description: "Game teka-teki" },
      { rawg_genre_id: 11, name: "Arcade", description: "Game arcade klasik" },
      {
        rawg_genre_id: 83,
        name: "Platformer",
        description: "Game lompat-lompat platform",
      },
      { rawg_genre_id: 1, name: "Racing", description: "Game balapan" },
      { rawg_genre_id: 15, name: "Sports", description: "Game olahraga" },
      {
        rawg_genre_id: 59,
        name: "Massively Multiplayer",
        description: "Game online dengan banyak pemain",
      },
      { rawg_genre_id: 19, name: "Family", description: "Game keluarga" },
      { rawg_genre_id: 6, name: "Fighting", description: "Game pertarungan" },
      { rawg_genre_id: 28, name: "Board Games", description: "Game papan" },
      { rawg_genre_id: 34, name: "Educational", description: "Game edukasi" },
      { rawg_genre_id: 17, name: "Card", description: "Game kartu" },
    ];

    // Use bulkInsert with explicit ids
    await queryInterface.bulkInsert(
      "genres",
      genres.map((g) => ({
        ...g,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      { ignoreDuplicates: true }
    );
  },

  down: async (queryInterface, Sequelize) => {
    const ids = [
      4, 51, 3, 5, 10, 2, 40, 14, 7, 11, 83, 1, 15, 59, 19, 6, 28, 34, 17,
    ];
    await queryInterface.bulkDelete("genres", { rawg_genre_id: ids }, {});
  },
};
