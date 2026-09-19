import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Film, Star, ChevronRight, ChevronLeft, Info, Flame } from 'lucide-react';
import { getBackdropUrl } from '../../services/tmdb';
import '../../styles/Hero.css';

export default function Hero({ movies = [], featured, onWatchClick, onTrailerClick }) {
  // Normalize movies list for dynamic rotation
  const slideMovies = React.useMemo(() => {
    let list = Array.isArray(movies) && movies.length > 0 ? movies : (featured ? [featured] : []);
    // Filter to movies with backdrops for a rich cinematic presentation
    const withBackdrop = list.filter(m => m && (m.backdrop_path || m.backdrop));
    return withBackdrop.length > 0 ? withBackdrop.slice(0, 7) : list.slice(0, 5);
  }, [movies, featured]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const timerRef = useRef(null);

  const totalSlides = slideMovies.length;
  const currentMovie = slideMovies[currentIndex] || slideMovies[0];

  const goToNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
      setIsFading(false);
    }, 280);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
      setIsFading(false);
    }, 280);
  }, [totalSlides]);

  const goToSlide = (index) => {
    if (index === currentIndex || index < 0 || index >= totalSlides) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsFading(false);
    }, 280);
  };

  // Auto rotation timer (7 seconds per slide, pauses on hover)
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSlides, isPaused, goToNext]);

  if (!currentMovie) return null;

  const title = currentMovie.title || currentMovie.original_title || 'فيلم مميز';
  const originalTitle = currentMovie.original_title && currentMovie.original_title !== title 
    ? currentMovie.original_title 
    : null;

  const backdropUrl = currentMovie.backdrop_path 
    ? getBackdropUrl(currentMovie.backdrop_path, 'original') 
    : (currentMovie.backdrop || '');

  const year = currentMovie.release_date 
    ? currentMovie.release_date.split('-')[0] 
    : (currentMovie.year || '2026');

  const rawRating = typeof currentMovie.vote_average === 'number' 
    ? currentMovie.vote_average 
    : parseFloat(currentMovie.rating) || 8.2;
  const rating = rawRating > 0 ? rawRating.toFixed(1) : '8.2';

  const overview = currentMovie.overview || currentMovie.description || 'استمتع بمشاهدة أحدث وأقوى الأعمال السينمائية العالمية بدقة فائقة وترجمة احترافية حصرية عبر Movora.';

  return (
    <section 
      className="hero"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      dir="rtl"
    >
      {/* Dynamic Cinematic Backdrop with Ken Burns Slow Zoom and Crossfade */}
      <div 
        key={currentMovie.id || currentIndex}
        className={`hero-backdrop-layer ${isFading ? 'fading' : 'active'}`}
        style={{ backgroundImage: `url(${backdropUrl})` }}
      />

      {/* Multi-gradient atmospheric overlay for flawless text legibility */}
      <div className="hero-gradient-overlay" />

      {/* Hero Content */}
      <div className={`hero-content ${isFading ? 'content-fade' : ''}`}>
        <div className="hero-eyebrow-wrap">
          <span className="hero-eyebrow-badge">
            <Flame size={14} className="flame-icon" />
            <span>MOVORA SPOTLIGHT • فيلم مميز الآن</span>
          </span>
          <span className="hero-slide-counter">
            {String(currentIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </span>
        </div>

        <h1 className="hero-title">{title}</h1>

        {originalTitle && (
          <p className="hero-original-title" dir="ltr">{originalTitle}</p>
        )}

        <div className="hero-meta-row">
          <span className="hero-meta-badge year">{year}</span>
          <span className="hero-meta-badge rating">
            <Star size={13} fill="currentColor" stroke="none" /> {rating}
          </span>
          <span className="hero-meta-badge quality">4K Ultra HD</span>
          <span className="hero-meta-badge lang">صوت إنجليزي أصلي</span>
          <span className="hero-meta-badge sub">مترجم</span>
        </div>

        <p className="hero-description">{overview}</p>

        <div className="hero-buttons">
          <button 
            className="hero-btn-primary" 
            onClick={() => onWatchClick && onWatchClick(currentMovie)}
            title="بدء تشغيل الفيلم فوراً"
          >
            <Play size={18} fill="currentColor" /> مشاهدة الآن
          </button>

          <button 
            className="hero-btn-secondary" 
            onClick={() => {
              if (onTrailerClick) {
                onTrailerClick(currentMovie);
              } else if (onWatchClick) {
                onWatchClick(currentMovie, 'trailer');
              }
            }}
            title="مشاهدة الإعلان الرسمي"
          >
            <Film size={18} /> الإعلان الرسمي
          </button>

          {currentMovie.id && (
            <Link 
              to={`/movie/${currentMovie.id}`} 
              className="hero-btn-info"
              title="تفاصيل الفيلم الكاملة"
            >
              <Info size={17} /> تفاصيل الفيلم
            </Link>
          )}
        </div>
      </div>

      {/* Slide Navigation Arrows */}
      {totalSlides > 1 && (
        <div className="hero-nav-arrows">
          <button 
            className="hero-arrow-btn prev" 
            onClick={goToPrev}
            aria-label="الفيلم السابق"
            title="الفيلم السابق"
          >
            <ChevronRight size={22} />
          </button>
          <button 
            className="hero-arrow-btn next" 
            onClick={goToNext}
            aria-label="الفيلم التالي"
            title="الفيلم التالي"
          >
            <ChevronLeft size={22} />
          </button>
        </div>
      )}

      {/* Bottom Slide Indicators with Progress Bar */}
      {totalSlides > 1 && (
        <div className="hero-indicators-container">
          <div className="hero-indicators">
            {slideMovies.map((movie, idx) => (
              <button
                key={movie.id || idx}
                className={`hero-indicator-item ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(idx)}
                title={movie.title || `فيلم ${idx + 1}`}
              >
                <span className="indicator-bar">
                  {idx === currentIndex && !isPaused && (
                    <span className="indicator-progress-fill" />
                  )}
                </span>
                <span className="indicator-label">{String(idx + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
