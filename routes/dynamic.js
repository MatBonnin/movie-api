const express = require('express');
const router = express.Router();
const { DataTypes } = require('sequelize');
const DynamicModel = require('../models/DynamicModel');
const sequelize = require('../sequelize');
const authenticateToken = require('../middleware/auth');

// Middleware pour protéger cette route (recommandé)
router.use(authenticateToken);

/**
 * POST /dynamic/create
 * Body:
 * {
 *   "name": "Book",
 *   "columns": {
 *     "title": "STRING",
 *     "author": "STRING",
 *     "publishedYear": "INTEGER"
 *   },
 *   "relations": {
 *     "authors": {
 *       "type": "belongsToMany",
 *       "model": "Author",
 *       "through": "BookAuthors"
 *     }
 *   }
 * }
 */
router.post('/create', async (req, res) => {
  const { name, columns, relations } = req.body;

  if (!name || !columns) {
    return res
      .status(400)
      .json({ error: 'Le nom et les colonnes sont requis.' });
  }

  try {
    // Vérifier si le modèle existe déjà
    const existingModel = await DynamicModel.findOne({ where: { name } });
    if (existingModel) {
      return res.status(400).json({ error: 'Le modèle existe déjà.' });
    }

    // Sauvegarder la définition du modèle dans la base de données
    const dynamicModel = await DynamicModel.create({
      name,
      schema: columns,
      relations,
    });

    // Définir dynamiquement le modèle Sequelize
    const Model = sequelize.define(name, columns, {});

    // Stocker le modèle dans l'objet sequelize.models pour qu'il soit accessible ailleurs
    sequelize.models[name] = Model;

    // Configurer les relations si spécifiées
    if (relations) {
      for (const [relationName, relation] of Object.entries(relations)) {
        const targetModel = sequelize.models[relation.model];
        if (!targetModel) {
          return res
            .status(400)
            .json({ error: `Le modèle cible ${relation.model} n'existe pas.` });
        }

        switch (relation.type) {
          case 'hasMany':
            Model.hasMany(targetModel, { as: relationName });
            break;
          case 'belongsToMany':
            Model.belongsToMany(targetModel, {
              through: relation.through,
              as: relationName,
            });
            break;
          // Ajouter d'autres types de relations si nécessaire
          default:
            return res
              .status(400)
              .json({
                error: `Type de relation ${relation.type} non supporté.`,
              });
        }
      }
    }

    // Synchroniser le nouveau modèle avec la base de données
    await Model.sync();

    // Générer automatiquement les routes CRUD pour ce modèle
    generateCRUDRoutes(name, Model, relations);

    res.status(201).json({ message: `Modèle ${name} créé avec succès.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création du modèle.' });
  }
});

/**
 * Fonction pour générer les routes CRUD dynamiques
 * @param {String} modelName - Nom du modèle
 * @param {Object} Model - Instance du modèle Sequelize
 * @param {Object} relations - Relations du modèle
 */
function generateCRUDRoutes(modelName, Model, relations) {
  const express = require('express');
  const router = express.Router();
  const { parseFilters, validateFields } = require('../utils/filterParser');
  const { Op } = require('sequelize');

  // GET /<modelName> - Récupérer tous les enregistrements avec filtres, champs spécifiques et relations
  router.get('/', async (req, res) => {
    try {
      const { filters, populate, fields } = req.query;
      let where = {};
      let include = [];
      let attributes;

      // Parsing des filtres
      if (filters) {
        // Les filtres sont envoyés sous forme de chaîne, il faut les parser en JSON
        const parsedFilters =
          typeof filters === 'string' ? JSON.parse(filters) : filters;
        where = parseFilters(parsedFilters);
      }

      // Validation des champs pour le modèle principal
      attributes = validateFields(modelName.toLowerCase(), fields);

      // Validation des relations si `populate` est spécifié
      if (populate) {
        const populateArray = Array.isArray(populate) ? populate : [populate];
        populateArray.forEach((rel) => {
          if (relations && relations[rel]) {
            const relation = relations[rel];
            const targetModel = sequelize.models[relation.model];
            if (targetModel) {
              include.push({
                model: targetModel,
                as: rel,
                attributes: validateFields(rel, fields) || [],
                through: { attributes: [] }, // Exclure la table de jonction si Many-to-Many
              });
            }
          }
        });
      }

      const records = await Model.findAll({
        where,
        include,
        attributes,
      });

      res.json(records);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /<modelName> - Créer un nouvel enregistrement
  router.post('/', async (req, res) => {
    try {
      const data = req.body;
      const record = await Model.create(data);

      // Gérer les relations Many-to-Many si spécifiées
      for (const [relationName, relation] of Object.entries(relations || {})) {
        if (relation.type === 'belongsToMany' && data[relationName]) {
          const relatedIds = data[relationName];
          const relatedModel = sequelize.models[relation.model];
          const relatedInstances = await relatedModel.findAll({
            where: { id: relatedIds },
          });
          await record[`add${capitalize(relation.model)}`](relatedInstances);
        }
      }

      res.status(201).json(record);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /<modelName>/:id - Récupérer un enregistrement spécifique avec relations
  router.get('/:id', async (req, res) => {
    try {
      const { populate, fields } = req.query;
      let include = [];
      let attributes;

      // Validation des champs pour le modèle principal
      attributes = validateFields(modelName.toLowerCase(), fields);

      // Validation des relations si `populate` est spécifié
      if (populate) {
        const populateArray = Array.isArray(populate) ? populate : [populate];
        populateArray.forEach((rel) => {
          if (relations && relations[rel]) {
            const relation = relations[rel];
            const targetModel = sequelize.models[relation.model];
            if (targetModel) {
              include.push({
                model: targetModel,
                as: rel,
                attributes: validateFields(rel, fields) || [],
                through: { attributes: [] }, // Exclure la table de jonction si Many-to-Many
              });
            }
          }
        });
      }

      const record = await Model.findByPk(req.params.id, {
        include,
        attributes,
      });

      if (record) {
        res.json(record);
      } else {
        res.status(404).json({ error: `${modelName} non trouvé.` });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /<modelName>/:id - Mettre à jour un enregistrement
  router.put('/:id', async (req, res) => {
    try {
      const record = await Model.findByPk(req.params.id);
      if (record) {
        const data = req.body;
        await record.update(data);

        // Gérer les relations Many-to-Many si spécifiées
        for (const [relationName, relation] of Object.entries(
          relations || {}
        )) {
          if (relation.type === 'belongsToMany' && data[relationName]) {
            const relatedIds = data[relationName];
            const relatedModel = sequelize.models[relation.model];
            const relatedInstances = await relatedModel.findAll({
              where: { id: relatedIds },
            });
            await record[`set${capitalize(relation.model)}`](relatedInstances);
          }
        }

        res.json(record);
      } else {
        res.status(404).json({ error: `${modelName} non trouvé.` });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /<modelName>/:id - Supprimer un enregistrement
  router.delete('/:id', async (req, res) => {
    try {
      const record = await Model.findByPk(req.params.id);
      if (record) {
        await record.destroy();
        res.json({ message: `${modelName} supprimé.` });
      } else {
        res.status(404).json({ error: `${modelName} non trouvé.` });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Intégrer le router dans l'application principale
  const app = require('../app'); // Assurez-vous que `app.js` exporte l'instance Express
  app.use(`/api/${modelName.toLowerCase()}`, router);
}

// Fonction pour capitaliser la première lettre
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = router;
