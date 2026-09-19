import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Star, Film, Loader2, Play, Sparkles, Flame } from 'lucide-react';
import Logo from '../shared/Logo';
import { searchMovies, getPosterUrl } from '../../services/tmdb';
import '../../styles/Navbar.css';

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewResults, setPreviewResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const searchWrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Handle scroll effect for glassmorphic navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync with URL query when user navigates
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [location.search]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced Live Search Autocomplete
  const handleQueryChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim() || val.trim().length < 2) {
      setPreviewResults([]);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchMovies(val.trim(), 1);
        setPreviewResults(Array.isArray(results) ? results.slice(0, 5) : []);
      } catch (err) {
        setPreviewResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 320);
  };

  // Submit full search to Home / Search Results view
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (searchQuery.trim()) {
      setShowDropdown(false);
      setMobileMenu(false);
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Select movie directly from preview dropdown
  const handleSelectMovie = (movie) => {
    setShowDropdown(false);
    setMobileMenu(false);
    setSearchQuery('');
    navigate(`/movie/${movie.id}`);
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
    setPreviewResults([]);
    setShowDropdown(false);
    if (location.search.includes('q=')) {
      navigate('/');
    }
  };

  const navLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'الأفلام الشائعة', path: '/?type=popular' },
    { name: 'عروض السينما', path: '/?type=now_playing' },
    { name: 'التصنيفات', path: '/categories' },
  ];

  return (
    <header className={`navbar ${isScrolled ? 'scrolled' : ''}`} dir="rtl">
      {/* Brand Logo with Custom Cinema Icon */}
      <div className="nav-brand-group">
        <Logo size="medium" showDomain={true} showBadge={true} badgeText="CINEMA" />
      </div>

      {/* Navigation Links */}
      <nav className={`nav-links ${mobileMenu ? 'open' : ''}`}>
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path && !location.search;
          return (
            <Link 
              key={link.name} 
              to={link.path}
              className={isActive ? 'active' : ''}
              onClick={() => setMobileMenu(false)}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Global Live Instant Search Bar */}
      <div className="nav-actions" ref={searchWrapperRef}>
        <form onSubmit={handleSearchSubmit} className={`search ${showDropdown ? 'active-focus' : ''}`}>
          <button type="submit" className="search-btn-icon" aria-label="بحث">
            {isSearching ? (
              <Loader2 size={16} className="search-spinner" />
            ) : (
              <Search size={16} />
            )}
          </button>

          <input 
            value={searchQuery} 
            onChange={handleQueryChange}
            onFocus={() => {
              if (searchQuery.trim().length >= 2 && previewResults.length > 0) {
                setShowDropdown(true);
              }
            }}
            placeholder="ابحث عن فيلم أو ممثل..." 
            dir="rtl"
            aria-label="بحث عن فيلم"
          />

          {searchQuery && (
            <button 
              type="button" 
              className="clear-nav-search" 
              onClick={handleClearSearch}
              title="مسح البحث"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Live Instant Search Dropdown Results */}
        {showDropdown && (
          <div className="search-dropdown-menu" dir="rtl">
            <div className="dropdown-header">
              <span>نتائج البحث الفوري</span>
              {isSearching && <span className="dropdown-searching">جاري البحث...</span>}
            </div>

            {previewResults.length > 0 ? (
              <div className="dropdown-results-list">
                {previewResults.map((movie) => {
                  const title = movie.title || movie.original_title || 'فيلم';
                  const year = movie.release_date ? movie.release_date.split('-')[0] : '';
                  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : null;
                  const poster = movie.poster_path ? getPosterUrl(movie.poster_path, 'w92') : null;

                  return (
                    <div 
                      key={movie.id}
                      className="dropdown-item"
                      onClick={() => handleSelectMovie(movie)}
                    >
                      <div className="dropdown-poster">
                        {poster ? (
                          <img src={poster} alt={title} loading="lazy" />
                        ) : (
                          <div className="dropdown-poster-placeholder">
                            <Film size={16} />
                          </div>
                        )}
                        <div className="dropdown-play-hover">
                          <Play size={12} fill="currentColor" />
                        </div>
                      </div>

                      <div className="dropdown-info">
                        <div className="dropdown-title">{title}</div>
                        <div className="dropdown-meta">
                          {year && <span className="dropdown-year">{year}</span>}
                          {rating && (
                            <span className="dropdown-rating">
                              <Star size={11} fill="currentColor" /> {rating}
                            </span>
                          )}
                          {movie.original_title && movie.original_title !== title && (
                            <span className="dropdown-original-title">{movie.original_title}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* View All Results Button */}
                <div 
                  className="dropdown-footer"
                  onClick={handleSearchSubmit}
                >
                  <Search size={13} />
                  <span>عرض كافة النتائج لـ "{searchQuery}"</span>
                  <span className="enter-hint">Enter ↵</span>
                </div>
              </div>
            ) : !isSearching ? (
              <div className="dropdown-empty">
                <Film size={24} style={{ opacity: 0.3, marginBottom: 6 }} />
                <span>لم يتم العثور على نتائج تطابق "{searchQuery}"</span>
              </div>
            ) : null}
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button 
          className="menu" 
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="القائمة"
        >
          {mobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
