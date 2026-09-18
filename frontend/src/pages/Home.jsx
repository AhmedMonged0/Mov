import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, RefreshCw, AlertCircle, Film, Sparkles } from 'lucide-react';
import Hero from '../components/home/Hero';
import MovieCard from '../components/shared/MovieCard';
import VideoModal from '../components/shared/VideoModal';
import { fetchPopularMovies, searchMovies, fetchMoviesByGenre } from '../services/tmdb';
import '../styles/Home.css';

const GENRES = [
  { id: 'all', name: 'الكل' },
  { id: 'popular', name: 'الأكثر شعبية' },
  { id: 28, name: 'أكشن' },
  { id: 18, name: 'دراما' },
  { id: 35, name: 'كوميدي' },
  { id: 16, name: 'أنيميشن' },
  { id: 878, name: 'خيال علمي' },
  { id: 27, name: 'رعب' },
  { id: 53, name: 'إثارة' },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [movies, setMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [activeSearchTerm, setActiveSearchTerm] = useState(urlQuery);
  const [selectedGenre, setSelectedGenre] = useState('all');

  // Video Player Modal State
  const [selectedMovie, setSelectedMovie] = useState(null);

  const debounceTimerRef = useRef(null);

  // 1. Fetch Popular Movies (Default State)
  const loadPopularMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchPopularMovies(1);
      setPopularMovies(results);
      setMovies(results);
    } catch (err) {
      console.error("Popular movies load error:", err);
      setError('تعذر تحميل الأفلام الشائعة من TMDB. يرجى التحقق من الاتصال.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Perform Direct TMDB Search
  const executeSearch = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setActiveSearchTerm('');
      setSelectedGenre('all');
      if (popularMovies.length > 0) {
        setMovies(popularMovies);
      } else {
        loadPopularMovies();
      }
      return;
    }

    setLoading(true);
    setError(null);
    setActiveSearchTerm(query.trim());
    setSelectedGenre('all');

    try {
      const results = await searchMovies(query.trim(), 1);
      setMovies(results);
    } catch (err) {
      console.error("Search error:", err);
      setError(`حدث خطأ أثناء البحث عن "${query}". يرجى المحاولة مرة أخرى.`);
    } finally {
      setLoading(false);
    }
  }, [popularMovies, loadPopularMovies]);

  // Initial mount load
  useEffect(() => {
    if (urlQuery) {
      setSearchTerm(urlQuery);
      executeSearch(urlQuery);
    } else {
      loadPopularMovies();
    }
  }, [urlQuery]);

  // Handle Input Change with Instant Search Debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (value.trim()) {
        executeSearch(value);
      } else if (activeSearchTerm) {
        cancelSearch();
      }
    }, 450);
  };

  // Submit Search form
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (searchTerm.trim()) {
      executeSearch(searchTerm);
    } else {
      cancelSearch();
    }
  };

  // 4. Cancel Search Handler
  const cancelSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchTerm('');
    setActiveSearchTerm('');
    setSelectedGenre('all');
    setSearchParams({});
    setError(null);

    if (popularMovies.length > 0) {
      setMovies(popularMovies);
    } else {
      loadPopularMovies();
    }
  };

  // Filter by Genre
  const handleGenreSelect = async (genreId) => {
    if (searchTerm || activeSearchTerm) {
      setSearchTerm('');
      setActiveSearchTerm('');
      setSearchParams({});
    }
    setSelectedGenre(genreId);
    setLoading(true);
    setError(null);

    try {
      if (genreId === 'all' || genreId === 'popular') {
        if (popularMovies.length > 0) {
          setMovies(popularMovies);
        } else {
          await loadPopularMovies();
        }
      } else {
        const results = await fetchMoviesByGenre(genreId, 1);
        setMovies(results);
      }
    } catch (err) {
      console.error("Genre fetch error:", err);
      setError('تعذر تحميل الأفلام لهذا التصنيف.');
    } finally {
      setLoading(false);
    }
  };

  const featuredMovie = popularMovies.length > 0 ? popularMovies[0] : (movies.length > 0 ? movies[0] : null);

  return (
    <div className="home-page" dir="rtl">
      {/* Hero Section */}
      {!activeSearchTerm && (
        <Hero 
          featured={featuredMovie} 
          onWatchClick={(movie) => setSelectedMovie(movie)} 
        />
      )}
      
      <section className="content home-content" style={activeSearchTerm ? { paddingTop: '110px' } : {}}>
        
        {/* Interactive Search Bar Section */}
        <div className="home-search-container">
          <form onSubmit={handleSearchSubmit} className="home-search-form">
            <div className="search-input-wrapper">
              <Search className="search-field-icon" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                placeholder="ابحث عن أي فيلم بالعربية أو بالإنجليزية (مثال: سبايدرمان، Batman)..."
                className="home-search-input"
                dir="rtl"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={cancelSearch}
                  className="search-clear-btn"
                  title="مسح البحث"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            <button type="submit" className="search-submit-btn">
              بحث
            </button>

            {/* Cancel Search Button */}
            {(activeSearchTerm || searchTerm) && (
              <button
                type="button"
                onClick={cancelSearch}
                className="cancel-search-action-btn"
                title="العودة إلى الأفلام الشائعة"
              >
                <X size={17} />
                <span>إلغاء البحث</span>
              </button>
            )}
          </form>
        </div>

        {/* Section Header */}
        <div className="section-head">
          <div>
            <span className="section-kicker">
              {activeSearchTerm ? 'SEARCH RESULTS' : 'TMDB POPULAR'}
            </span>
            <h2>
              {activeSearchTerm ? (
                <>نتائج البحث عن: <span className="highlight-term">"{activeSearchTerm}"</span></>
              ) : (
                'الأفلام الشائعة الآن'
              )}
            </h2>
          </div>

          <div className="section-actions">
            {activeSearchTerm ? (
              <button className="cancel-search-pill" onClick={cancelSearch}>
                <X size={15} /> العودة للأفلام الشائعة
              </button>
            ) : (
              <button className="see-all" onClick={loadPopularMovies} title="تحديث القائمة">
                <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> تحديث القائمة
              </button>
            )}
          </div>
        </div>

        {/* Genre Filters */}
        {!activeSearchTerm && (
          <div className="filters">
            {GENRES.map(g => (
              <button 
                key={g.id} 
                className={`filter ${selectedGenre === g.id ? "active" : ""}`} 
                onClick={() => handleGenreSelect(g.id)}
              >
                {g.id === 'popular' && <Sparkles size={14} style={{ marginLeft: 5 }} />}
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Error Handling State */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={22} />
            <p>{error}</p>
            <button onClick={activeSearchTerm ? () => executeSearch(activeSearchTerm) : loadPopularMovies}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-grid">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-poster"></div>
                <div className="skeleton-title"></div>
                <div className="skeleton-meta"></div>
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          /* Empty State */
          <div className="empty-state">
            <Film size={48} className="empty-icon" />
            <h3>لا توجد نتائج مطابقة</h3>
            <p>
              {activeSearchTerm 
                ? `لم نتمكن من العثور على أفلام باسم "${activeSearchTerm}". يرجى تجربة كلمات أخرى.`
                : 'لا تتوفر أفلام في هذا التصنيف حالياً.'}
            </p>
            {activeSearchTerm && (
              <button className="primary" onClick={cancelSearch} style={{ marginTop: '16px' }}>
                <X size={16} /> إلغاء البحث والعودة للرئيسية
              </button>
            )}
          </div>
        ) : (
          /* Movies Grid with click-to-watch */
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
      </section>

      {/* Interactive Video Streaming Modal */}
      {selectedMovie && (
        <VideoModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
        />
      )}
    </div>
  );
}
