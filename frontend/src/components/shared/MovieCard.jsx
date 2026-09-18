import React, { useState } from 'react';
import { Play, Star, Film } from 'lucide-react';
import { getPosterUrl } from '../../services/tmdb';
import '../../styles/MovieCard.css';

export default function MovieCard({ movie, onMovieClick }) {
  const [imgError, setImgError] = useState(false);

  if (!movie) return null;

  // Title with Arabic fallback
  const title = movie.title || movie.original_title || movie.name || 'بدون عنوان';
  
  // Release year extraction
  const releaseDate = movie.release_date || movie.first_air_date || '';
  const year = releaseDate ? releaseDate.split('-')[0] : (movie.year || 'غير محدد');

  // Rating computation
  const rawRating = typeof movie.vote_average === 'number' ? movie.vote_average : parseFloat(movie.rating) || 0;
  const ratingFormatted = rawRating > 0 ? rawRating.toFixed(1) : null;

  // TMDB official poster URL
  const posterUrl = movie.poster_path 
    ? getPosterUrl(movie.poster_path, 'w500') 
    : (movie.poster || null);

  // Quality badge or TMDB HD indicator
  const quality = movie.quality || (movie.vote_average >= 7 ? 'HD' : null);

  const handleClick = (e) => {
    e.preventDefault();
    if (onMovieClick) {
      onMovieClick(movie);
    }
  };

  return (
    <div 
      className="movie-card" 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title={`${title} - انقر للمشاهدة المباشرة`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
    >
      <div className="poster-wrap">
        {posterUrl && !imgError ? (
          <img 
            src={posterUrl} 
            alt={title} 
            loading="lazy" 
            onError={() => setImgError(true)}
          />
        ) : (
          /* Elegant Poster Placeholder */
          <div className="poster-placeholder">
            <div className="placeholder-icon-wrap">
              <Film size={34} className="placeholder-film-icon" />
            </div>
            <span className="placeholder-brand">MOVORA</span>
            <p className="placeholder-title">{title}</p>
            <span className="placeholder-year">{year}</span>
          </div>
        )}

        {quality && <span className="quality">{quality}</span>}
        
        {/* Interactive Hover Overlay with Glowing Play Icon */}
        <div className="play-overlay">
          <div className="play-icon-pulse-wrap">
            <span className="play-icon-circle">
              <Play size={24} fill="currentColor" />
            </span>
          </div>
          <span className="play-watch-badge">مشاهدة الفيلم الآن</span>
        </div>
      </div>

      <div className="card-title" title={title}>{title}</div>
      
      <div className="meta">
        <span className="year-tag">{year}</span>
        {ratingFormatted && (
          <div className="rating" title={`التقييم: ${ratingFormatted} من 10`}>
            <Star size={13} fill="currentColor" stroke="none" />
            <span>{ratingFormatted}</span>
          </div>
        )}
      </div>
    </div>
  );
}
