import React, { useState, useEffect } from 'react';
import { X, Server, Film, Play, Star, AlertCircle, Maximize2 } from 'lucide-react';
import { TMDB_API_KEY, fetchMovieVideos } from '../../services/tmdb';
import '../../styles/VideoModal.css';

export default function VideoModal({ movie, onClose }) {
  const [activeServer, setActiveServer] = useState('primary'); // 'primary' | 'backup' | 'trailer'
  const [trailerKey, setTrailerKey] = useState(null);
  const [loadingTrailer, setLoadingTrailer] = useState(true);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Fetch Trailer from TMDB
  useEffect(() => {
    if (!movie?.id) return;
    
    let isMounted = true;
    setLoadingTrailer(true);

    const loadTrailer = async () => {
      try {
        const videos = await fetchMovieVideos(movie.id);
        if (!isMounted) return;

        // Find official trailer
        const trailer = 
          videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
          videos.find(v => v.site === 'YouTube') ||
          videos[0];

        if (trailer && trailer.key) {
          setTrailerKey(trailer.key);
        } else {
          setTrailerKey(null);
        }
      } catch (err) {
        console.error('Failed to load trailer:', err);
      } finally {
        if (isMounted) setLoadingTrailer(false);
      }
    };

    loadTrailer();
    return () => {
      isMounted = false;
    };
  }, [movie]);

  if (!movie) return null;

  const title = movie.title || movie.original_title || 'مشاهدة الفيلم';
  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : (movie.year || '');
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : (movie.rating || null);

  // Determine iframe source based on active server
  let iframeSrc = '';
  if (activeServer === 'primary') {
    iframeSrc = `https://vidsrc.sbs/embed/movie/${movie.id}`;
  } else if (activeServer === 'backup') {
    iframeSrc = `https://embed.su/embed/movie/${movie.id}`;
  } else if (activeServer === 'trailer') {
    iframeSrc = trailerKey 
      ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0` 
      : 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
  }

  return (
    <div className="video-modal-overlay" onClick={onClose} dir="rtl">
      <div 
        className="video-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="video-modal-header">
          <div className="video-modal-title-group">
            <div className="modal-icon-badge">
              <Play size={16} fill="currentColor" />
            </div>
            <div>
              <h3 className="video-modal-title">{title}</h3>
              <div className="video-modal-meta">
                {releaseYear && <span className="modal-year">{releaseYear}</span>}
                {rating && (
                  <span className="modal-rating">
                    <Star size={12} fill="currentColor" /> {rating}
                  </span>
                )}
                <span className="modal-badge-movora">Movora Player</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button 
            className="video-modal-close-btn" 
            onClick={onClose} 
            title="إغلاق المشغل (Esc)"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        {/* Server Switcher Controls */}
        <div className="video-modal-servers">
          <div className="server-label">
            <Server size={15} />
            <span>اختر سيرفر المشاهدة:</span>
          </div>

          <div className="server-buttons">
            <button
              className={`server-btn ${activeServer === 'primary' ? 'active' : ''}`}
              onClick={() => setActiveServer('primary')}
            >
              <span className="server-dot"></span>
              سيرفر المشاهدة الرئيسي
            </button>

            <button
              className={`server-btn ${activeServer === 'backup' ? 'active' : ''}`}
              onClick={() => setActiveServer('backup')}
            >
              <span className="server-dot backup"></span>
              سيرفر بديل (EmbedSu)
            </button>

            <button
              className={`server-btn ${activeServer === 'trailer' ? 'active' : ''}`}
              onClick={() => setActiveServer('trailer')}
              disabled={loadingTrailer && !trailerKey}
            >
              <Film size={14} />
              الإعلان الرسمي (Trailer)
            </button>
          </div>
        </div>

        {/* Video Player Iframe Container (Responsive aspect-video) */}
        <div className="video-player-frame-wrapper">
          <iframe
            key={`${activeServer}-${movie.id}`}
            src={iframeSrc}
            title={title}
            className="video-player-iframe"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            referrerPolicy="origin"
          />
        </div>

        {/* Player Bottom Info Bar */}
        <div className="video-modal-footer">
          <div className="player-hint">
            <span>💡 ملاحظة: في حال واجهت بطء في التحميل، يمكنك التبديل إلى السيرفر البديل أعلاه فوراً.</span>
          </div>
          <button className="close-bottom-btn" onClick={onClose}>
            إغلاق المشغل
          </button>
        </div>
      </div>
    </div>
  );
}
