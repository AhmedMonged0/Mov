import React, { useState, useEffect } from 'react';
import { X, Server, Film, Play, Star, ShieldCheck, Languages } from 'lucide-react';
import { fetchMovieVideos } from '../../services/tmdb';
import { trackMovieStream } from '../../services/analyticsTracker';
import '../../styles/VideoModal.css';

export default function VideoModal({ movie, initialServer = 'primary', onClose }) {
  const [activeServer, setActiveServer] = useState(initialServer); // 'primary' | 'multiembed' | 'backup' | 'trailer'
  const [trailerKey, setTrailerKey] = useState(null);
  const [loadingTrailer, setLoadingTrailer] = useState(true);

  // Track movie stream in analytics
  useEffect(() => {
    if (movie && activeServer !== 'trailer') {
      trackMovieStream(movie, activeServer);
    }
  }, [movie, activeServer]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Prevent third-party iframe from hijacking parent window (Top-Redirect Hijack Protection)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
    return () => { isMounted = false; };
  }, [movie]);

  if (!movie) return null;

  const title = movie.title || movie.original_title || 'مشاهدة الفيلم';
  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : (movie.year || '');
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : (movie.rating || null);

  // Sources selection with Original English Audio guaranteed
  let iframeSrc = '';
  if (activeServer === 'primary') {
    // Flagship VidSrc: Always original English audio with CC subtitle selector
    iframeSrc = `https://vidsrc.me/embed/movie?tmdb=${movie.id}`;
  } else if (activeServer === 'multiembed') {
    // MultiEmbed: English audio + prominent multi-language subtitle track menu (including Arabic)
    iframeSrc = `https://multiembed.mov/?video_id=${movie.id}&tmdb=1`;
  } else if (activeServer === 'backup') {
    // VidSrc Pro: Clean English original audio
    iframeSrc = `https://vidsrc.to/embed/movie/${movie.id}`;
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
                <span className="modal-badge-movora">Movora Cinema (English Audio)</span>
              </div>
            </div>
          </div>

          <div className="modal-header-actions">
            {/* Movora Secure Stream Badge */}
            <div 
              className="ad-shield-badge active"
              title="نظام موفورا الذكي لحماية مسار البث وتوفير الصوت الإنجليزي الأصلي"
            >
              <ShieldCheck size={14} />
              <span>بث آمن ومباشر</span>
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
        </div>

        {/* Server Switcher Controls */}
        <div className="video-modal-servers">
          <div className="server-label">
            <Server size={15} />
            <span>سيرفرات الصوت الإنجليزي:</span>
          </div>

          <div className="server-buttons">
            <button
              className={`server-btn ${activeServer === 'primary' ? 'active' : ''}`}
              onClick={() => setActiveServer('primary')}
            >
              <span className="server-dot"></span>
              سيرفر إنجليزي رئيسي (VidSrc)
            </button>

            <button
              className={`server-btn ${activeServer === 'multiembed' ? 'active' : ''}`}
              onClick={() => setActiveServer('multiembed')}
            >
              <span className="server-dot multi"></span>
              سيرفر الترجمة المتعددة (MultiEmbed)
            </button>

            <button
              className={`server-btn ${activeServer === 'backup' ? 'active' : ''}`}
              onClick={() => setActiveServer('backup')}
            >
              <span className="server-dot backup"></span>
              سيرفر إنجليزي بديل (VidSrc Pro)
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
          />
        </div>

        {/* Player Bottom Info Bar with Subtitle Guidance */}
        <div className="video-modal-footer">
          <div className="player-hint">
            <Languages size={15} style={{ color: '#ff315a', verticalAlign: 'middle', marginLeft: 6, flexShrink: 0 }} />
            <span>
              <strong>الصوت الأساسي: إنجليزي أصلي.</strong> لاختيار أو تفعيل الترجمة للعربية أو أي لغة، اضغط على زر الترجمة <strong>(CC أو Subtitles)</strong> داخل شاشة المشغل واختر <strong>Arabic</strong>.
            </span>
          </div>
          <button className="close-bottom-btn" onClick={onClose}>
            إغلاق المشغل
          </button>
        </div>
      </div>
    </div>
  );
}
