const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Actor = sequelize.define('Actor', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Actor;
