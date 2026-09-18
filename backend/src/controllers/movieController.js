import prisma from '../config/db.js';

export const getMovies = async (req, res) => {
  try {
    const { search, genre, type, random, limit } = req.query;
    
    let where = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }
    if (genre && genre !== 'All') {
      where.genres = { some: { name: genre } };
    }
    
    let movies = await prisma.movie.findMany({
      where,
      include: { genres: true }
    });
    
    let result = movies.map(m => ({ ...m, type: 'movie', genre: m.genres[0]?.name || 'General' }));

    // Always shuffle randomly when random=true
    if (random === 'true') {
      result = result.sort(() => Math.random() - 0.5);
    }

    if (limit) {
      result = result.slice(0, parseInt(limit));
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: { genres: true }
    });
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    res.json({ ...movie, type: 'movie', genre: movie.genres[0]?.name || 'General' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
