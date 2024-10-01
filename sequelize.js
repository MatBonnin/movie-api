// sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('movie_db', 'db_user', '1234', {
  host: 'localhost',
  dialect: 'postgres',
});

module.exports = sequelize;
