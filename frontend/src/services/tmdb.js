// TMDB Official Direct API Service for Movora (movora.me)

export const TMDB_API_KEY =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TMDB_API_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_TMDB_API_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TMDB_API_KEY) ||
  '8cb7e82b636a10030a1cfa44f580e49f';

const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * Build official poster URL from TMDB
 * Path format: https://image.tmdb.org/t/p/w500${poster_path}
 */
export const getPosterUrl = (posterPath, size = 'w500') => {
  if (!posterPath) return null;
  return `${IMAGE_BASE_URL}/${size}${posterPath}`;
};

/**
 * Build official backdrop URL from TMDB
 */
export const getBackdropUrl = (backdropPath, size = 'original') => {
  if (!backdropPath) return null;
  return `${IMAGE_BASE_URL}/${size}${backdropPath}`;
};

/**
 * Get popular movies in Arabic (Default State for Home page)
 * https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=ar&page=1
 */
export const fetchPopularMovies = async (page = 1) => {
  try {
    const url = `${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=ar&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TMDB Error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch popular movies from TMDB:', error);
    throw error;
  }
};

/**
 * Get trending movies (day / week)
 * https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}&language=ar
 */
export const fetchTrendingMovies = async (timeWindow = 'day', page = 1) => {
  try {
    const url = `${BASE_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}&language=ar&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Trending Error: ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch trending movies:', error);
    return [];
  }
};

/**
 * Get now playing movies in theatres
 */
export const fetchNowPlayingMovies = async (page = 1) => {
  try {
    const url = `${BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=ar&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Now Playing Error: ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch now playing movies:', error);
    return [];
  }
};

/**
 * Get top rated movies
 */
export const fetchTopRatedMovies = async (page = 1) => {
  try {
    const url = `${BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=ar&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Top Rated Error: ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch top rated movies:', error);
    return [];
  }
};

/**
 * Search movies in Arabic (Search Bar)
 * https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=ar&query=${searchTerm}
 */
export const searchMovies = async (searchTerm, page = 1) => {
  if (!searchTerm || !searchTerm.trim()) {
    return [];
  }
  try {
    const query = encodeURIComponent(searchTerm.trim());
    const url = `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=ar&query=${query}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TMDB Search Error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error(`Failed to search movies for "${searchTerm}":`, error);
    throw error;
  }
};

/**
 * Get movie details by ID in Arabic
 * https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=ar
 */
export const fetchMovieDetails = async (movieId) => {
  try {
    const url = `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=ar&append_to_response=videos,credits,similar`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TMDB Movie Details Error: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch movie details for ID ${movieId}:`, error);
    throw error;
  }
};

/**
 * Get movie trailers / videos
 */
export const fetchMovieVideos = async (movieId) => {
  try {
    // Try Arabic first
    let res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=ar`);
    let data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results;
    }
    // Fallback to English trailers if Arabic not available
    res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`);
    data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error(`Failed to fetch videos for movie ${movieId}:`, error);
    return [];
  }
};

/**
 * Discover movies by category / genre ID
 */
export const fetchMoviesByGenre = async (genreId, page = 1) => {
  try {
    const url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=ar&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch movies by genre');
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to discover movies by genre:', error);
    throw error;
  }
};

/**
 * Pick a random high-rated movie from TMDB (Surprise Me / Random Movie feature)
 */
export const fetchRandomMovie = async () => {
  // Curated list of legendary popular movies as reliable fallback
  const fallbackMovieIds = [
    157336, // Interstellar
    27205,  // Inception
    155,    // The Dark Knight
    680,    // Pulp Fiction
    550,    // Fight Club
    299536, // Avengers: Infinity War
    299534, // Avengers: Endgame
    671,    // Harry Potter
    19995,  // Avatar
    278,    // The Shawshank Redemption
    238,    // The Godfather
    497,    // The Green Mile
    324857, // Spider-Man: Into the Spider-Verse
    569094, // Spider-Man: Across the Spider-Verse
    429,    // The Good, the Bad and the Ugly
    122,    // The Lord of the Rings: The Return of the King
    98,     // Gladiator
    389,    // 12 Angry Men
    637,    // Life Is Beautiful
    496243, // Parasite
    693134, // Dune: Part Two
    438631, // Dune
    872585, // Oppenheimer
    939243, // Sonic the Hedgehog 3
  ];

  try {
    // Pick random page between 1 and 8 to get fresh diverse high-rated movies
    const randomPage = Math.floor(Math.random() * 8) + 1;
    const isTopRated = Math.random() > 0.4;
    const endpoint = isTopRated ? 'top_rated' : 'popular';
    
    const url = `${BASE_URL}/movie/${endpoint}?api_key=${TMDB_API_KEY}&language=ar&page=${randomPage}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const results = (data.results || []).filter(
        m => m.poster_path && m.vote_average >= 6.8 && (m.title || m.original_title)
      );
      if (results.length > 0) {
        const picked = results[Math.floor(Math.random() * results.length)];
        return picked;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch dynamic random movie, using fallback:', err);
  }

  // Fallback to random ID from curated top list
  const randomFallbackId = fallbackMovieIds[Math.floor(Math.random() * fallbackMovieIds.length)];
  return { id: randomFallbackId };
};

// =========================================================================
// TV SERIES & SHOWS API SERVICES
// =========================================================================

export const TV_GENRES = [
  { id: 'all', name: 'الكل' },
  { id: 10759, name: 'حركة ومغامرة' },
  { id: 18, name: 'دراما' },
  { id: 80, name: 'جريمة' },
  { id: 10765, name: 'خيال علمي وفانتازيا' },
  { id: 35, name: 'كوميديا' },
  { id: 9648, name: 'غموض' },
  { id: 16, name: 'أنمي ورسوم متحركة' },
  { id: 10768, name: 'حرب وسياسة' },
  { id: 99, name: 'وثائقي' }
];

/**
 * Get popular TV shows in Arabic
 */
export const fetchPopularSeries = async (page = 1) => {
  try {
    const url = `${BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=ar&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch popular TV series:', error);
    return [];
  }
};

/**
 * Get top rated TV series
 */
export const fetchTopRatedSeries = async (page = 1) => {
  try {
    const url = `${BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}&language=ar&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch top rated TV series:', error);
    return [];
  }
};

/**
 * Get currently airing / on the air TV series
 */
export const fetchOnTheAirSeries = async (page = 1) => {
  try {
    const url = `${BASE_URL}/tv/on_the_air?api_key=${TMDB_API_KEY}&language=ar&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch on the air TV series:', error);
    return [];
  }
};

/**
 * Get trending TV series
 */
export const fetchTrendingSeries = async (timeWindow = 'day', page = 1) => {
  try {
    const url = `${BASE_URL}/trending/tv/${timeWindow}?api_key=${TMDB_API_KEY}&language=ar&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch trending TV series:', error);
    return [];
  }
};

/**
 * Get TV series full details by ID (with videos, credits, similar)
 */
export const fetchSeriesDetails = async (seriesId) => {
  try {
    const url = `${BASE_URL}/tv/${seriesId}?api_key=${TMDB_API_KEY}&language=ar&append_to_response=videos,credits,similar`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB TV Details Error: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch TV details for ID ${seriesId}:`, error);
    throw error;
  }
};

/**
 * Get season episodes details
 */
export const fetchSeasonDetails = async (seriesId, seasonNumber = 1) => {
  try {
    const url = `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=ar`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Season Details Error: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch season ${seasonNumber} for TV series ${seriesId}:`, error);
    return null;
  }
};

/**
 * Search TV Series by title
 */
export const searchSeries = async (searchTerm, page = 1) => {
  if (!searchTerm || !searchTerm.trim()) return [];
  try {
    const query = encodeURIComponent(searchTerm.trim());
    const url = `${BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&language=ar&query=${query}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Search TV Error: ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error(`Failed to search TV series for "${searchTerm}":`, error);
    return [];
  }
};

/**
 * Fetch TV series by genre
 */
export const fetchSeriesByGenre = async (genreId, page = 1) => {
  try {
    const url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=ar&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch TV series by genre');
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to discover TV series by genre:', error);
    return [];
  }
};

export default {
  TMDB_API_KEY,
  IMAGE_BASE_URL,
  TV_GENRES,
  getPosterUrl,
  getBackdropUrl,
  fetchPopularMovies,
  fetchTrendingMovies,
  fetchNowPlayingMovies,
  fetchTopRatedMovies,
  searchMovies,
  fetchMovieDetails,
  fetchMovieVideos,
  fetchMoviesByGenre,
  fetchRandomMovie,
  fetchPopularSeries,
  fetchTopRatedSeries,
  fetchOnTheAirSeries,
  fetchTrendingSeries,
  fetchSeriesDetails,
  fetchSeasonDetails,
  searchSeries,
  fetchSeriesByGenre,
};
