// routes/actors.js
const express = require('express');
const router = express.Router();
const Actor = require('../models/Actor');
const Movie = require('../models/Movie');
const { parseFilters, validateFields } = require('../utils/filterParser');

// GET /actors - Récupérer tous les acteurs avec filtres, champs spécifiques et leurs films
// GET /actors - Récupérer tous les acteurs avec filtres, champs spécifiques et leurs films
router.get('/', async (req, res) => {
  try {
    const { filters, populate, fields } = req.query;
    let where = {};
    let include = [];
    let attributes;

    // Parsing des filtres
    if (filters) {
      where = parseFilters(filters);
    }

    // Validation des champs pour `actors`
    attributes = validateFields('actors', fields);

    // Validation des champs pour les films si `populate=movies`
    if (populate === 'movies') {
      let movieAttributes = validateFields('movies', fields);

      include.push({
        model: Movie,
        as: 'movies',
        attributes: movieAttributes || [], // Par défaut, inclure 'title' si non spécifié
        through: { attributes: [] }, // Exclure la table de jonction `MovieActors`
      });
    }

    const actors = await Actor.findAll({
      where,
      include,
      attributes, // Limiter les champs des acteurs
    });

    res.json(actors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /actors - Créer un nouvel acteur
router.post('/', async (req, res) => {
  try {
    const { name, movies } = req.body;
    const actor = await Actor.create({ name });

    if (movies && movies.length > 0) {
      const moviesInstances = await Movie.findAll({ where: { id: movies } });
      await actor.addMovies(moviesInstances);
    }

    res.status(201).json(actor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /actors/:id - Récupérer un acteur spécifique avec ses films
router.get('/:id', async (req, res) => {
  try {
    const { populate, fields } = req.query;
    let include = [];
    let attributes;

    // Validation des champs pour `actors`
    attributes = validateFields('actors', fields);

    // Validation des champs pour les films si `populate=movies`
    if (populate === 'movies') {
      let movieAttributes = validateFields('movies', fields);

      include.push({
        model: Movie,
        as: 'movies',
        attributes: movieAttributes || ['title'], // Par défaut, inclure 'title' si non spécifié
        through: { attributes: [] }, // Exclure la table de jonction `MovieActors`
      });
    }

    const actor = await Actor.findByPk(req.params.id, {
      include,
      attributes, // Limiter les champs des acteurs
    });

    if (actor) {
      res.json(actor);
    } else {
      res.status(404).json({ error: 'Acteur non trouvé' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /actors/:id - Mettre à jour un acteur
router.put('/:id', async (req, res) => {
  try {
    const actor = await Actor.findByPk(req.params.id);
    if (actor) {
      const { name, movies } = req.body;
      await actor.update({ name });

      if (movies) {
        const moviesInstances = await Movie.findAll({ where: { id: movies } });
        await actor.setMovies(moviesInstances);
      }

      res.json(actor);
    } else {
      res.status(404).json({ error: 'Acteur non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /actors/:id - Supprimer un acteur
router.delete('/:id', async (req, res) => {
  try {
    const actor = await Actor.findByPk(req.params.id);
    if (actor) {
      await actor.destroy();
      res.json({ message: 'Acteur supprimé' });
    } else {
      res.status(404).json({ error: 'Acteur non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
