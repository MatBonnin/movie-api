const express = require('express');
const sequelize = require('./sequelize');
const Movie = require('./models/Movie');
const Actor = require('./models/Actor');
const User = require('./models/User'); // Importer le modèle User
require('./models/associations'); // Importer les associations
const dotenv = require('dotenv');

const moviesRouter = require('./routes/movies');
const actorsRouter = require('./routes/actors');
const importRouter = require('./routes/import');
const authRouter = require('./routes/auth'); // Importer la route d'authentification
const authenticateToken = require('./middleware/auth'); // Importer le middleware d'authentification

dotenv.config();

const app = express();
app.use(express.json());

// Route d'authentification (non protégée)
app.use('/api/auth', authRouter);

// Appliquer le middleware d'authentification aux routes suivantes
app.use('/api/movies', authenticateToken, moviesRouter);
app.use('/api/actors', authenticateToken, actorsRouter);
app.use('/api/import-movies', authenticateToken, importRouter);

// Synchroniser les modèles
sequelize
  .sync({ force: false })
  .then(() => {
    console.log('Base de données synchronisée');
  })
  .catch((err) => {
    console.error('Erreur de synchronisation de la base de données :', err);
  });

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
