import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, RefreshCw, AlertCircle, Film, Sparkles, Flame, Star, Clapperboard, Shuffle } from 'lucide-react';
import Hero from '../components/home/Hero';
import MovieCard from '../components/shared/MovieCard';
import VideoModal from '../components/shared/VideoModal';
import { 
  fetchPopularMovies, 
  fetchTrendingMovies, 
  fetchNowPlayingMovies, 
  fetchTopRatedMovies, 
  searchMovies, 
  fetchMoviesByGenre 
} from '../services/tmdb';
import '../styles/Home.css';

const GENRES = [
  { id: 'all', name: 'الكل' },
  { id: 28, name: 'أكشن' },
  { id: 18, name: 'دراما' },
  { id: 35, name: 'كوميدي' },
  { id: 16, name: 'أنيميشن' },
  { id: 878, name: 'خيال علمي' },
  { id: 27, name: 'رعب' },
  { id: 53, name: 'إثارة' },
  { id: 10749, name: 'رومانسي' },
];

const FEED_TABS = [
  { id: 'trending', label: 'الأكثر تداولاً اليوم', icon: Flame },
  { id: 'popular', label: 'الأكثر شعبية', icon: Sparkles },
  { id: 'now_playing', label: 'أحدث عروض السينما', icon: Clapperboard },
  { id: 'top_rated', label: 'الأعلى تقييماً', icon: Star },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [heroMovies, setHeroMovies] = useState([]);
  const [movies, setMovies] = useState([]);
  const [activeTab, setActiveTab] = useState('trending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [activeSearchTerm, setActiveSearchTerm] = useState(urlQuery);
  const [selectedGenre, setSelectedGenre] = useState('all');

  // Video Player Modal State
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [initialPlayerServer, setInitialPlayerServer] = useState('primary');

  const debounceTimerRef = useRef(null);

  // 1. Fetch Dynamic Hero Movies (Trending Worldwide)
  const loadHeroMovies = useCallback(async () => {
    try {
      const trending = await fetchTrendingMovies('day');
      if (trending && trending.length > 0) {
        setHeroMovies(trending);
      }
    } catch (err) {
      console.warn("Could not load trending for hero, falling back to popular:", err);
    }
  }, []);

  // 2. Fetch movies based on active feed tab
  const loadFeedMovies = useCallback(async (tab = 'trending', page = 1) => {
    setLoading(true);
    setError(null);
    try {
      let results = [];
      if (tab === 'trending') {
        results = await fetchTrendingMovies('day', page);
      } else if (tab === 'now_playing') {
        results = await fetchNowPlayingMovies(page);
      } else if (tab === 'top_rated') {
        results = await fetchTopRatedMovies(page);
      } else {
        results = await fetchPopularMovies(page);
      }

      setMovies(results || []);
      if (heroMovies.length === 0 && results && results.length > 0) {
        setHeroMovies(results);
      }
    } catch (err) {
      console.error(`Feed load error for tab ${tab}:`, err);
      setError('تعذر تحميل الأفلام من TMDB. يرجى التحقق من اتصال الإنترنت.');
    } finally {
      setLoading(false);
    }
  }, [heroMovies.length]);

  // 3. Shuffle / Dynamic Periodic Refresh of movies
  const handleShuffleMovies = async () => {
    if (activeSearchTerm) return;
    setRefreshing(true);
    try {
      // Pick a random page between 1 and 4 for rich variety
      const randomPage = Math.floor(Math.random() * 4) + 1;
      let results = [];
      if (selectedGenre !== 'all') {
        results = await fetchMoviesByGenre(selectedGenre, randomPage);
      } else {
        if (activeTab === 'trending') {
          results = await fetchTrendingMovies('day', randomPage);
        } else if (activeTab === 'now_playing') {
          results = await fetchNowPlayingMovies(randomPage);
        } else if (activeTab === 'top_rated') {
          results = await fetchTopRatedMovies(randomPage);
        } else {
          results = await fetchPopularMovies(randomPage);
        }
      }

      // Slightly randomize order to give a fresh look
      if (results && results.length > 0) {
        const shuffled = [...results].sort(() => 0.5 - Math.random());
        setMovies(shuffled);
      }
    } catch (err) {
      console.error("Shuffle error:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // 4. Perform Direct TMDB Search
  const executeSearch = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setActiveSearchTerm('');
      setSelectedGenre('all');
      loadFeedMovies(activeTab);
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
  }, [activeTab, loadFeedMovies]);

  // Initial mount load
  useEffect(() => {
    loadHeroMovies();
    if (urlQuery) {
      setSearchTerm(urlQuery);
      executeSearch(urlQuery);
    } else {
      loadFeedMovies(activeTab);
    }
  }, [urlQuery]);

  // Periodic subtle refresh of recommendations every 3 minutes to keep content fresh
  useEffect(() => {
    const periodicTimer = setInterval(() => {
      if (!activeSearchTerm && selectedGenre === 'all') {
        loadFeedMovies(activeTab);
      }
    }, 180000); // 3 minutes

    return () => clearInterval(periodicTimer);
  }, [activeSearchTerm, selectedGenre, activeTab, loadFeedMovies]);

  // Handle Tab Switch
  const handleTabSelect = (tabId) => {
    if (activeSearchTerm) {
      cancelSearch();
    }
    setActiveTab(tabId);
    setSelectedGenre('all');
    loadFeedMovies(tabId);
  };

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

  // Cancel Search Handler
  const cancelSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchTerm('');
    setActiveSearchTerm('');
    setSelectedGenre('all');
    setSearchParams({});
    setError(null);
    loadFeedMovies(activeTab);
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
      if (genreId === 'all') {
        await loadFeedMovies(activeTab);
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

  // Open player modal with specific server
  const handleWatchMovie = (movie, server = 'primary') => {
    setInitialPlayerServer(server);
    setSelectedMovie(movie);
  };

  return (
    <div className="home-page" dir="rtl">
      {/* Dynamic Rotating Hero Spotlight Showcase */}
      {!activeSearchTerm && (
        <Hero 
          movies={heroMovies.length > 0 ? heroMovies : movies}
          onWatchClick={(movie) => handleWatchMovie(movie, 'primary')}
          onTrailerClick={(movie) => handleWatchMovie(movie, 'trailer')}
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
                placeholder="ابحث عن أي فيلم بالعربية أو بالإنجليزية (مثال: Batman, Inception, سبايدرمان)..."
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
                title="العودة للرئيسية"
              >
                <X size={17} />
                <span>إلغاء البحث</span>
              </button>
            )}
          </form>
        </div>

        {/* Feed Tabs: Trending, Popular, Now Playing, Top Rated */}
        {!activeSearchTerm && (
          <div className="feed-tabs-container">
            <div className="feed-tabs">
              {FEED_TABS.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id && selectedGenre === 'all';
                return (
                  <button
                    key={tab.id}
                    className={`feed-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleTabSelect(tab.id)}
                  >
                    <IconComponent size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Header with Dynamic Shuffle Button */}
        <div className="section-head">
          <div>
            <span className="section-kicker">
              {activeSearchTerm ? 'SEARCH RESULTS' : 'MOVORA STREAMING'}
            </span>
            <h2 className="section-title-highlight">
              {activeSearchTerm ? (
                <>نتائج البحث عن: <span className="highlight-term">"{activeSearchTerm}"</span></>
              ) : selectedGenre !== 'all' ? (
                `أفلام ${GENRES.find(g => g.id === selectedGenre)?.name || ''}`
              ) : (
                FEED_TABS.find(t => t.id === activeTab)?.label || 'أحدث الأفلام'
              )}
            </h2>
          </div>

          <div className="section-actions">
            {activeSearchTerm ? (
              <button className="cancel-search-pill" onClick={cancelSearch}>
                <X size={15} /> العودة للأفلام الشائعة
              </button>
            ) : (
              <button 
                className={`shuffle-refresh-btn ${refreshing ? 'spinning' : ''}`} 
                onClick={handleShuffleMovies} 
                title="تحديث واقتراح أفلام متجددة تلقائياً"
                disabled={loading || refreshing}
              >
                <Shuffle size={15} />
                <span>تجديد الاقتراحات</span>
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
            <button onClick={activeSearchTerm ? () => executeSearch(activeSearchTerm) : () => loadFeedMovies(activeTab)}>
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
                onMovieClick={(m) => handleWatchMovie(m, 'primary')} 
              />
            ))}
          </div>
        )}
      </section>

      {/* Interactive Video Streaming Modal */}
      {selectedMovie && (
        <VideoModal 
          movie={selectedMovie} 
          initialServer={initialPlayerServer}
          onClose={() => setSelectedMovie(null)} 
        />
      )}
    </div>
  );
}
