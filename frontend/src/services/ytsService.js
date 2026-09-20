/**
 * YTS High-Speed Free Torrent & Direct Download Service
 * Automatically fetches real torrents, direct .torrent links, and Magnet links
 * for any movie globally using multi-mirror failover and fast trackers.
 */

const YTS_MIRRORS = [
  'https://movies-api.accel.li/api/v2',
  'https://yts.lt/api/v2',
  'https://yts.do/api/v2',
  'https://yts.am/api/v2',
];

const FAST_TRACKERS = [
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.openbittorrent.com:80',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://glotorrents.pw:6969/announce',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://torrent.gresille.org:80/announce',
  'udp://p4p.arenabg.com:1337',
  'udp://tracker.leechers-paradise.org:6969',
]
  .map((t) => '&tr=' + encodeURIComponent(t))
  .join('');

/**
 * Generate standard Magnet URI from info_hash and movie title
 */
export function buildMagnetLink(hash, movieTitle = 'Movie') {
  if (!hash) return '#';
  const name = encodeURIComponent(movieTitle);
  return `magnet:?xt=urn:btih:${hash}&dn=${name}${FAST_TRACKERS}`;
}

/**
 * Human-friendly quality label and sorting rank
 */
function parseQuality(q, type) {
  const norm = (q || '').toLowerCase();
  const typeStr = (type || 'bluray').toUpperCase();

  if (norm.includes('2160') || norm.includes('4k')) {
    return { label: `4K Ultra HD (${typeStr})`, rank: 3, badge: '4K UHD' };
  }
  if (norm.includes('1080')) {
    return { label: `1080p Full HD (${typeStr})`, rank: 2, badge: '1080p' };
  }
  if (norm.includes('720')) {
    return { label: `720p HD (${typeStr})`, rank: 1, badge: '720p' };
  }
  return { label: `${q} (${typeStr})`, rank: 0, badge: q };
}

/**
 * Fetch real download torrents for a movie by IMDb ID or Title
 */
export async function fetchMovieDownloads(imdbId, movieTitle = '', movieYear = '') {
  const cleanImdb = (imdbId || '').trim();
  const cleanTitle = (movieTitle || '').trim();

  // Try each mirror until one responds with valid movie data
  for (const mirror of YTS_MIRRORS) {
    try {
      let movieData = null;

      // 1. Try by IMDb ID first (most accurate)
      if (cleanImdb && cleanImdb.startsWith('tt')) {
        const url = `${mirror}/movie_details.json?imdb_id=${cleanImdb}&with_images=false`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.movie?.id && json.data.movie.torrents?.length > 0) {
            movieData = json.data.movie;
          }
        }
      }

      // 2. Fallback: Search by clean English title if IMDb didn't return torrents
      if (!movieData && cleanTitle) {
        const queryTerm = encodeURIComponent(cleanTitle);
        const searchUrl = `${mirror}/list_movies.json?query_term=${queryTerm}&limit=5`;
        const res = await fetch(searchUrl, { signal: AbortSignal.timeout(4500) });
        if (res.ok) {
          const json = await res.json();
          const movies = json?.data?.movies || [];
          if (movies.length > 0) {
            // Find best match by year or first result
            const match = movieYear 
              ? movies.find((m) => String(m.year) === String(movieYear)) || movies[0]
              : movies[0];
            if (match && match.torrents?.length > 0) {
              movieData = match;
            }
          }
        }
      }

      // If we got torrents, process and return them
      if (movieData && Array.isArray(movieData.torrents) && movieData.torrents.length > 0) {
        const titleForMagnet = movieData.title || cleanTitle || 'Movie';
        
        // Remove duplicates by quality & format
        const seen = new Set();
        const formatted = [];

        for (const t of movieData.torrents) {
          const { label, rank, badge } = parseQuality(t.quality, t.type);
          const key = `${t.quality}-${t.type}`;
          if (seen.has(key)) continue;
          seen.add(key);

          formatted.push({
            quality: label,
            badge,
            rank,
            rawQuality: t.quality,
            type: (t.type || 'bluray').toUpperCase(),
            size: t.size || '1.5 GB',
            sizeBytes: t.size_bytes || 0,
            seeds: t.seeds ?? 0,
            peers: t.peers ?? 0,
            videoCodec: t.video_codec || 'x264',
            torrentUrl: t.url,
            hash: t.hash,
            magnetUrl: buildMagnetLink(t.hash, titleForMagnet),
          });
        }

        // Sort descending by rank (4K -> 1080p -> 720p)
        formatted.sort((a, b) => b.rank - a.rank);

        return {
          success: true,
          source: 'YTS High-Speed P2P',
          torrents: formatted,
        };
      }
    } catch (err) {
      // Continue to next mirror if this one times out or errors
      continue;
    }
  }

  return {
    success: false,
    torrents: [],
  };
}
