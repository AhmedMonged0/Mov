// Scraping service deprecated and removed.
// Movora now uses official TMDB API directly for stability and performance.

export const runCimalightScraper = async () => {
  console.log('[Notice] Web scraping is disabled. Data is fetched directly from TMDB.');
  return { status: 'disabled', message: 'Scraping is deprecated. TMDB API is active.' };
};

export const runMovieScraper = runCimalightScraper;
export default { runCimalightScraper, runMovieScraper };
