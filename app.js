const express = require('express');
const sequelize = require('./sequelize');
const Movie = require('./models/Movie');
const Actor = require('./models/Actor');
const User = require('./models/User');

const DynamicModel = require('./models/DynamicModel');
require('./models/associations'); // Importer les associations
const dotenv = require('dotenv');

const moviesRouter = require('./routes/movies');
const actorsRouter = require('./routes/actors');
const importRouter = require('./routes/import');
const authRouter = require('./routes/auth');
const dynamicRouter = require('./routes/dynamic'); // Importer la route dynamique
const authenticateToken = require('./middleware/auth');

dotenv.config();

const app = express();
app.use(express.json());

// Routes d'authentification (non protégées)
app.use('/api/auth', authRouter);

// Route pour la création dynamique d'entités (protégée)
app.use('/api/dynamic', authenticateToken, dynamicRouter);

// Appliquer le middleware d'authentification aux routes suivantes
app.use('/api/movies', authenticateToken, moviesRouter);
app.use('/api/actors', authenticateToken, actorsRouter);
app.use('/api/import-movies', authenticateToken, importRouter);

// Fonction pour générer les routes CRUD dynamiques (définie dans dynamic.js)
const generateCRUDRoutes = require('./routes/dynamic').generateCRUDRoutes;

// Synchroniser les modèles et charger les modèles dynamiques existants
sequelize
  .sync({ force: false })
  .then(async () => {
    console.log('Base de données synchronisée');

    // Charger les modèles dynamiques depuis la base de données
    const dynamicModels = await DynamicModel.findAll();
    dynamicModels.forEach((dynamic) => {
      const { name, schema, relations } = dynamic;
      const Model = sequelize.define(name, schema, {});

      // Configurer les relations si spécifiées
      if (relations) {
        for (const [relationName, relation] of Object.entries(relations)) {
          const targetModel = sequelize.models[relation.model];
          if (targetModel) {
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
                console.warn(`Type de relation ${relation.type} non supporté.`);
            }
          } else {
            console.warn(
              `Modèle cible ${relation.model} non trouvé pour la relation ${relationName}.`
            );
          }
        }
      }

      // Synchroniser le modèle avec la base de données
      Model.sync();

      // Générer les routes CRUD pour ce modèle
      generateCRUDRoutes(name, Model, relations);
    });
  })
  .catch((err) => {
    console.error('Erreur de synchronisation de la base de données :', err);
  });

// Exporter l'application pour qu'elle puisse être utilisée dans les routes dynamiques
module.exports = app;

// Démarrer le serveur uniquement si le fichier est exécuté directement
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
}
