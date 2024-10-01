const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Movie = sequelize.define('Movie', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  releaseDate: {
    type: DataTypes.DATE,
  },
  director: {
    type: DataTypes.STRING,
  },
});

module.exports = Movie;
