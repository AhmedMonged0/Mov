// Scraper routes removed in favor of direct official TMDB API
import express from 'express';
const router = express.Router();

router.all('*', (req, res) => {
  res.status(410).json({ 
    message: 'Scraping service has been deprecated and disabled. Movora uses official TMDB API directly.' 
  });
});

export default router;
