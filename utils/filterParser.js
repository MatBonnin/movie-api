const { Op } = require('sequelize');

/**
 * Traduit les filtres en clauses Sequelize
 * @param {Object} filters - Les filtres envoyés
 * @returns {Object} - Clauses Sequelize pour le WHERE
 */
function parseFilters(filters) {
  const where = {};

  for (const [field, condition] of Object.entries(filters)) {
    for (const [operator, value] of Object.entries(condition)) {
      switch (operator) {
        case '$eq':
          where[field] = { [Op.eq]: value };
          break;
        case '$ne':
          where[field] = { [Op.ne]: value };
          break;
        case '$contains':
          where[field] = { [Op.substring]: value };
          break;
        case '$startsWith':
          where[field] = { [Op.startsWith]: value };
          break;
        case '$endsWith':
          where[field] = { [Op.endsWith]: value };
          break;
        case '$gte':
          where[field] = { [Op.gte]: value };
          break;
        case '$lte':
          where[field] = { [Op.lte]: value };
          break;
        case '$gt':
          where[field] = { [Op.gt]: value };
          break;
        case '$lt':
          where[field] = { [Op.lt]: value };
          break;
        // Ajoute d'autres opérateurs si nécessaire
        default:
          break;
      }
    }
  }

  return where;
}

/**
 * Traduit les champs spécifiques demandés en attributs Sequelize
 * @param {Object} fields - Les champs demandés
 * @returns {Array<String>} - Liste des attributs Sequelize
 */
function parseFields(fields) {
  if (!fields || Object.keys(fields).length === 0) {
    return null;
  }

  return fields.split(',').map((field) => field.trim());
}

/**
 * Validation des champs à inclure dans la requête Sequelize
 * @param {String} modelName - Le nom du modèle (ex: 'movies', 'actors')
 * @param {Object} queryFields - Les champs envoyés dans la query
 * @returns {Object} - Attributs Sequelize pour le modèle principal et les modèles inclus
 */
function validateFields(modelName, queryFields) {
  const attributes = {};
  const fields = queryFields ? queryFields[modelName] : null;

  if (fields) {
    attributes[modelName] = parseFields(fields);
  }

  return attributes[modelName] || null;
}

module.exports = { parseFilters, parseFields, validateFields };
