// models/associations.js
const Movie = require('./Movie');
const Actor = require('./Actor');

// Définir la relation Many-to-Many entre Movie et Actor
Movie.belongsToMany(Actor, { through: 'MovieActors', as: 'actors' });
Actor.belongsToMany(Movie, { through: 'MovieActors', as: 'movies' });
