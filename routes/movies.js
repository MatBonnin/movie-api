// routes/movies.js
const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Actor = require('../models/Actor');
const { parseFilters, validateFields } = require('../utils/filterParser');
const { Op } = require('sequelize');

// GET /movies - Récupérer tous les films avec filtres, champs spécifiques et leurs acteurs
// GET /movies - Récupérer tous les films avec filtres, champs spécifiques et leurs acteurs
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

    // Validation des champs pour `movies`
    attributes = validateFields('movies', fields);

    // Validation des champs pour les acteurs si `populate=actors`
    if (populate === 'actors') {
      let actorAttributes = validateFields('actors', fields);

      include.push({
        model: Actor,
        as: 'actors',
        attributes: actorAttributes || [], // Par défaut, inclure 'name' si non spécifié
        through: { attributes: [] }, // Exclure la table de jonction `MovieActors`
      });
    }

    const movies = await Movie.findAll({
      where,
      include,
      attributes, // Limiter les champs des films
    });

    res.json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST /movies - Créer un nouveau film
router.post('/', async (req, res) => {
  try {
    const { title, description, releaseDate, director, actors } = req.body;
    const movie = await Movie.create({
      title,
      description,
      releaseDate,
      director,
    });

    if (actors && actors.length > 0) {
      const actorsInstances = await Actor.findAll({ where: { id: actors } });
      await movie.addActors(actorsInstances);
    }

    res.status(201).json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /movies/:id - Récupérer un film spécifique avec ses acteurs
router.get('/:id', async (req, res) => {
  try {
    const { populate, fields } = req.query;
    let include = [];
    let attributes;

    // Validation des champs pour `movies`
    attributes = validateFields('movies', fields);

    // Validation des champs pour les acteurs si `populate=actors`
    if (populate === 'actors') {
      let actorAttributes = validateFields('actors', fields);

      include.push({
        model: Actor,
        as: 'actors',
        attributes: actorAttributes || ['name'], // Par défaut, inclure 'name' si non spécifié
        through: { attributes: [] }, // Exclure la table de jonction `MovieActors`
      });
    }

    const movie = await Movie.findByPk(req.params.id, {
      include,
      attributes, // Limiter les champs des films
    });

    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ error: 'Film non trouvé' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /movies/:id - Mettre à jour un film
router.put('/:id', async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (movie) {
      const { title, description, releaseDate, director, actors } = req.body;
      await movie.update({ title, description, releaseDate, director });

      if (actors) {
        const actorsInstances = await Actor.findAll({ where: { id: actors } });
        await movie.setActors(actorsInstances);
      }

      res.json(movie);
    } else {
      res.status(404).json({ error: 'Film non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /movies/:id - Supprimer un film
router.delete('/:id', async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (movie) {
      await movie.destroy();
      res.json({ message: 'Film supprimé' });
    } else {
      res.status(404).json({ error: 'Film non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
