const Movie = require('./Movie');
const Actor = require('./Actor');
const User = require('./User');
const DynamicModel = require('./DynamicModel');

// Définir la relation Many-to-Many entre Movie et Actor
Movie.belongsToMany(Actor, { through: 'MovieActors', as: 'actors' });
Actor.belongsToMany(Movie, { through: 'MovieActors', as: 'movies' });

// Vous pouvez ajouter des associations supplémentaires si nécessaire
