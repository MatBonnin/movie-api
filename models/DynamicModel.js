const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const DynamicModel = sequelize.define('DynamicModel', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  schema: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  relations: {
    type: DataTypes.JSON,
    allowNull: true,
  },
});

module.exports = DynamicModel;
