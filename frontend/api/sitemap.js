const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '8cb7e82b636a10030a1cfa44f580e49f';
const BASE_URL = 'https://api.themoviedb.org/3';

export default async function handler(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch trending and popular movies in parallel
    const [trendingRes, popularRes] = await Promise.all([
      fetch(`${BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}&language=ar`),
      fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=ar&page=1`)
    ]).catch(() => [null, null]);

    let movies = [];
    if (trendingRes && trendingRes.ok) {
      const data = await trendingRes.json();
      if (Array.isArray(data.results)) movies.push(...data.results);
    }
    if (popularRes && popularRes.ok) {
      const data = await popularRes.json();
      if (Array.isArray(data.results)) movies.push(...data.results);
    }

    // Deduplicate by ID
    const uniqueMovies = Array.from(new Map(movies.map(m => [m.id, m])).values());

    const staticRoutes = [
      { url: 'https://movora.me/', changefreq: 'hourly', priority: '1.0' },
      { url: 'https://movora.me/categories', changefreq: 'daily', priority: '0.9' },
      { url: 'https://movora.me/?type=popular', changefreq: 'daily', priority: '0.8' },
      { url: 'https://movora.me/?type=now_playing', changefreq: 'daily', priority: '0.8' },
      { url: 'https://movora.me/?type=top_rated', changefreq: 'weekly', priority: '0.7' },
    ];

    const genres = [28, 18, 35, 16, 878, 27, 53, 10749, 80, 99];
    const genreRoutes = genres.map(g => ({
      url: `https://movora.me/categories?genre=${g}`,
      changefreq: 'weekly',
      priority: '0.7'
    }));

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static and Category Routes
    [...staticRoutes, ...genreRoutes].forEach(item => {
      xml += '  <url>\n';
      xml += `    <loc>${item.url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
      xml += `    <priority>${item.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Movie Detail Pages
    uniqueMovies.forEach(movie => {
      const releaseDate = movie.release_date || today;
      xml += '  <url>\n';
      xml += `    <loc>https://movora.me/movie/${movie.id}</loc>\n`;
      xml += `    <lastmod>${releaseDate}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    const today = new Date().toISOString().split('T')[0];
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://movora.me/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://movora.me/categories</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(fallbackXml);
  }
}
