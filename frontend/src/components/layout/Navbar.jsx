import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Star, Film, Loader2, Play, Sparkles, Flame, Send, Dices, Clapperboard } from 'lucide-react';
import Logo from '../shared/Logo';
import { searchMovies, getPosterUrl, fetchRandomMovie } from '../../services/tmdb';
import MovieRequestModal from '../shared/MovieRequestModal';
import '../../styles/Navbar.css';

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewResults, setPreviewResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Handle Surprise / Random Movie Roulette
  const handleRandomMovie = async () => {
    if (isRollingDice) return;
    setIsRollingDice(true);
    try {
      const movie = await fetchRandomMovie();
      if (movie && movie.id) {
        navigate(`/movie/${movie.id}`);
      }
    } catch (err) {
      console.error('Error selecting random movie:', err);
    } finally {
      setIsRollingDice(false);
    }
  };

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

  // Keep dropdown open even during ad popups or outside clicks
  // Close on route change or Escape key
  useEffect(() => {
    setShowDropdown(false);
    setMobileSearchOpen(false);
    setMobileMenu(false);
  }, [location.pathname]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open mobile full-width search
  const openMobileSearch = () => {
    setMobileSearchOpen(true);
    setMobileMenu(false);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 120);
  };

  // Close mobile full-width search
  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    setShowDropdown(false);
  };

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
        setPreviewResults(Array.isArray(results) ? results.slice(0, 6) : []);
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
      setMobileSearchOpen(false);
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Select movie directly from preview dropdown
  const handleSelectMovie = (movie) => {
    setShowDropdown(false);
    setMobileMenu(false);
    setMobileSearchOpen(false);
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
    { name: 'التصنيفات', path: '/categories' },
  ];

  return (
    <>
      <header className={`navbar ${isScrolled ? 'scrolled' : ''} ${mobileSearchOpen ? 'mobile-search-active' : ''}`} dir="rtl">
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

        <a 
          href="https://t.me/movora_me" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="nav-tg-pill"
          title="قناة موفورا الرسمية على تليجرام"
          onClick={() => setMobileMenu(false)}
        >
          <Send size={13} />
          <span>تليجرام</span>
        </a>

        {/* Mobile Drawer Only Actions */}
        <div className="mobile-drawer-actions">
          <button 
            type="button" 
            className="mobile-drawer-btn random"
            onClick={() => {
              setMobileMenu(false);
              handleRandomMovie();
            }}
            disabled={isRollingDice}
          >
            <Dices size={16} className={isRollingDice ? 'spin-dice' : ''} />
            <span>فيلم عشوائي 🎲</span>
          </button>

          <button 
            type="button" 
            className="mobile-drawer-btn request"
            onClick={() => {
              setMobileMenu(false);
              setShowRequestModal(true);
            }}
          >
            <Clapperboard size={16} />
            <span>طلب فيلم أو مسلسل 🎬</span>
          </button>
        </div>
      </nav>

      {/* Global Live Instant Search Bar & Actions */}
      <div className="nav-actions" ref={searchWrapperRef} onClick={(e) => e.stopPropagation()}>
        {/* Quick Surprise / Random Movie Trigger */}
        {!mobileSearchOpen && (
          <button 
            type="button" 
            className={`nav-action-quick-btn random ${isRollingDice ? 'loading' : ''}`}
            onClick={handleRandomMovie}
            title="فيلم عشوائي - اقترح لي فيلماً لسهرة الليلة 🎲"
            disabled={isRollingDice}
          >
            <Dices size={16} className={isRollingDice ? 'spin-dice' : ''} />
            <span className="quick-btn-label">فيلم عشوائي</span>
          </button>
        )}

        {/* Quick Movie Request Modal Trigger */}
        {!mobileSearchOpen && (
          <button 
            type="button" 
            className="nav-action-quick-btn request"
            onClick={() => setShowRequestModal(true)}
            title="اطلب فيلماً أو مسلسلاً 🎬"
          >
            <Clapperboard size={15} />
            <span className="quick-btn-label">طلب فيلم</span>
          </button>
        )}

        {/* Mobile Search Trigger Icon (Visible only on mobile when search is NOT open) */}
        {!mobileSearchOpen && (
          <button 
            type="button" 
            className="mobile-search-trigger-btn"
            onClick={openMobileSearch}
            aria-label="فتح البحث"
            title="بحث عن فيلم أو ممثل"
          >
            <Search size={19} />
          </button>
        )}

        {/* Search Form (Always visible on desktop, or on mobile in mobile-search-active mode) */}
        <form 
          onSubmit={handleSearchSubmit} 
          className={`search ${showDropdown ? 'active-focus' : ''} ${mobileSearchOpen ? 'mobile-expanded' : ''}`}
        >
          <button type="submit" className="search-btn-icon" aria-label="بحث">
            {isSearching ? (
              <Loader2 size={16} className="search-spinner" />
            ) : (
              <Search size={16} />
            )}
          </button>

          <input 
            ref={searchInputRef}
            value={searchQuery} 
            onChange={handleQueryChange}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) {
                setShowDropdown(true);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (searchQuery.trim().length >= 2) {
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
              onClick={(e) => {
                e.stopPropagation();
                handleClearSearch();
              }}
              title="مسح البحث"
            >
              <X size={14} />
            </button>
          )}

          {/* Cancel button in mobile search mode */}
          {mobileSearchOpen && (
            <button 
              type="button" 
              className="mobile-cancel-search-btn"
              onClick={closeMobileSearch}
            >
              إلغاء
            </button>
          )}
        </form>

        {/* Live Instant Search Dropdown Results (Protected against ad popups) */}
        {showDropdown && (
          <div 
            className="search-dropdown-menu" 
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dropdown-header">
              <div className="dropdown-header-info">
                <span>نتائج البحث الفوري</span>
                {isSearching && <span className="dropdown-searching">جاري البحث...</span>}
              </div>
              <button 
                type="button"
                className="close-dropdown-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(false);
                }}
                title="إغلاق قائمة الاقتراحات"
              >
                <X size={13} />
                <span>إغلاق</span>
              </button>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMovie(movie);
                      }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSearchSubmit(e);
                  }}
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

        {/* Mobile Menu Toggle (Hidden when mobile search is open) */}
        {!mobileSearchOpen && (
          <button 
            className="menu" 
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="القائمة"
          >
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
      </div>
    </header>

    {/* Movie Request Modal (Outside header to avoid backdrop-filter stacking context) */}
    <MovieRequestModal 
      isOpen={showRequestModal} 
      onClose={() => setShowRequestModal(false)} 
    />
  </>
  );
}
