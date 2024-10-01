// tmdb.js
const axios = require('axios');
const Movie = require('./models/Movie');
const Actor = require('./models/Actor');

const apiKey =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3ZDcwNGY2ZWUyYmViMWJlOWI1MzZkNDZkMzA1YzFiOSIsIm5iZiI6MTcyNzY5NTQyMC43NTA0NzgsInN1YiI6IjYzMzFhNzg4NjYzYjg3MDA4NTU5OTFkYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.tQE9yOj5FUG7Zg_URMeVfw0zOIWPY2VHMtgtR2RnpzM'; // Remplace par ton token API

async function fetchMoviesFromTMDb() {
  const url = `https://api.themoviedb.org/3/movie/popular?language=fr-FR&page=1`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const movies = response.data.results;

    for (const movieData of movies) {
      // Vérifier si le film existe déjà
      let movie = await Movie.findOne({ where: { title: movieData.title } });
      if (!movie) {
        movie = await Movie.create({
          title: movieData.title,
          description: movieData.overview,
          releaseDate: movieData.release_date,
        });
      }

      // Récupérer les détails du film pour obtenir les acteurs et le réalisateur
      const detailsUrl = `https://api.themoviedb.org/3/movie/${movieData.id}?language=fr-FR&append_to_response=credits`;

      const detailsResponse = await axios.get(detailsUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const credits = detailsResponse.data.credits;

      // Ajouter le réalisateur
      const director = credits.crew.find((member) => member.job === 'Director');
      if (director) {
        await movie.update({ director: director.name });
      }

      // Ajouter les acteurs
      const actorsData = credits.cast.slice(0, 5); // Limiter à 5 acteurs

      for (const actorData of actorsData) {
        // Vérifier si l'acteur existe déjà
        let actor = await Actor.findOne({ where: { name: actorData.name } });
        if (!actor) {
          actor = await Actor.create({ name: actorData.name });
        }

        // Associer l'acteur au film
        await movie.addActor(actor);
      }
    }

    console.log('Films et acteurs importés avec succès !');
  } catch (error) {
    console.error('Erreur lors de la récupération des films : ', error);
  }
}

module.exports = { fetchMoviesFromTMDb };
