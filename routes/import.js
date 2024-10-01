// routes/import.js
const express = require('express');
const router = express.Router();
const { fetchMoviesFromTMDb } = require('../tmdb');

router.get('/', async (req, res) => {
  try {
    await fetchMoviesFromTMDb();
    res.json({ message: 'Importation terminée avec succès.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
