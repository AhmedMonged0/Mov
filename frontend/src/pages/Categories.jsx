import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/shared/MovieCard';
import VideoModal from '../components/shared/VideoModal';
import { fetchMoviesByGenre, fetchPopularMovies } from '../services/tmdb';
import { updatePageSEO, resetPageSEO } from '../services/seoHelper';

const CATEGORY_MAP = [
  { id: 'all', name: 'الكل' },
  { id: 28, name: 'أكشن ومغامرات' },
  { id: 18, name: 'دراما' },
  { id: 35, name: 'كوميدي' },
  { id: 16, name: 'رسوم متحركة' },
  { id: 878, name: 'خيال علمي' },
  { id: 27, name: 'رعب' },
  { id: 53, name: 'إثارة وتشويق' },
  { id: 10749, name: 'رومانسي' },
  { id: 80, name: 'جريمة وغموض' },
  { id: 99, name: 'وثائقي' },
];

export default function Categories() {
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    const loadCategoryMovies = async () => {
      setLoading(true);
      try {
        if (selectedCategory === 'all') {
          const results = await fetchPopularMovies(1);
          setMovies(results);
        } else {
          const results = await fetchMoviesByGenre(selectedCategory, 1);
          setMovies(results);
        }
      } catch (err) {
        console.error("Categories fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCategoryMovies();
  }, [selectedCategory]);

  useEffect(() => {
    const categoryName = CATEGORY_MAP.find(c => String(c.id) === String(selectedCategory))?.name || 'التصنيفات';
    const isAll = selectedCategory === 'all';
    
    updatePageSEO({
      title: isAll 
        ? 'تصنيفات الأفلام والمسلسلات | موفورا Movora'
        : `أفلام ${categoryName} مترجمة بجودة عالية | موفورا Movora`,
      description: isAll
        ? 'استكشف تصنيفات الأفلام المتنوعة: أكشن، دراما، كوميدي، رعب، خيال علمي، وأنيميشن بجودة 1080p وترجمة عربية حصرية على موفورا (movora.me).'
        : `تصفح وشاهد أقوى أفلام ${categoryName} العربية والأجنبية المترجمة بدقة عالية 1080p و 4K بدون إعلانات وبسيرفرات سريعة على موفورا.`,
      canonicalUrl: isAll ? 'https://movora.me/categories' : `https://movora.me/categories?genre=${selectedCategory}`,
      keywords: `افلام ${categoryName}, مشاهدة افلام ${categoryName}, تصنيف ${categoryName}, موفورا, movora, افلام 2026, افلام مترجمة`,
      ogType: 'website'
    });

    return () => {
      resetPageSEO();
    };
  }, [selectedCategory]);

  return (
    <div className="content" style={{ paddingTop: '120px' }} dir="rtl">
      <div className="section-head">
        <div>
          <span className="section-kicker">TMDB CATEGORIES</span>
          <h2>تصنيفات الأفلام</h2>
        </div>
      </div>

      <div className="filters">
        {CATEGORY_MAP.map(cat => (
          <button 
            key={cat.id} 
            className={`filter ${selectedCategory === cat.id ? "active" : ""}`} 
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-grid">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-poster"></div>
              <div className="skeleton-title"></div>
              <div className="skeleton-meta"></div>
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <h3>لا توجد أفلام متوفرة في هذا التصنيف حالياً.</h3>
        </div>
      ) : (
        <div className="movie-grid">
          {movies.map(movie => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              onMovieClick={(m) => setSelectedMovie(m)} 
            />
          ))}
        </div>
      )}

      {/* Video Streaming Modal */}
      {selectedMovie && (
        <VideoModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
        />
      )}
    </div>
  );
}
