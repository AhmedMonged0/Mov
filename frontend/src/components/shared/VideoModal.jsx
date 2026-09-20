import React, { useState, useEffect } from 'react';
import { X, Server, Film, Play, Star, ShieldCheck, Languages, Crown } from 'lucide-react';
import { fetchMovieVideos } from '../../services/tmdb';
import { trackMovieStream } from '../../services/analyticsTracker';
import { isVipActive, subscribeToVip } from '../../services/vipService';
import AdBannerSlot from './AdBannerSlot';
import '../../styles/VideoModal.css';

export default function VideoModal({ movie, initialServer = 'primary', onClose }) {
  const [activeServer, setActiveServer] = useState(initialServer); // 'primary' | 'multiembed' | 'backup' | 'trailer'
  const [trailerKey, setTrailerKey] = useState(null);
  const [loadingTrailer, setLoadingTrailer] = useState(true);
  const [isVip, setIsVip] = useState(() => isVipActive());

  useEffect(() => {
    return subscribeToVip((status) => {
      setIsVip(!!status.isVip);
    });
  }, []);

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

  // Sources selection with Original English Audio guaranteed (Prioritizing Ad-Free VidLink)
  let iframeSrc = '';
  if (activeServer === 'primary') {
    // Flagship VidLink HD: Ultra-clean, ad-free player, original English audio + built-in Arabic CC subtitles
    iframeSrc = `https://vidlink.pro/movie/${movie.id}`;
  } else if (activeServer === 'autoembed') {
    // Fast clean alternative
    iframeSrc = `https://player.autoembed.cc/embed/movie/${movie.id}`;
  } else if (activeServer === 'multiembed') {
    // MultiEmbed: English audio + prominent multi-language subtitle track menu
    iframeSrc = `https://multiembed.mov/?video_id=${movie.id}&tmdb=1`;
  } else if (activeServer === 'backup') {
    // VidSrc: Classic backup
    iframeSrc = `https://vidsrc.me/embed/movie?tmdb=${movie.id}`;
  } else if (activeServer === 'trailer') {
    iframeSrc = trailerKey 
      ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0` 
      : 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
  }

  return (
    <div className="video-modal-overlay" onClick={onClose} dir="rtl">
      {/* Floating Universal Close Button (Always visible on screen) */}
      <button 
        className="floating-close-modal-btn" 
        onClick={onClose} 
        title="إغلاق المشغل (Esc)"
        aria-label="إغلاق المشغل"
      >
        <X size={22} />
      </button>

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
                <span className="modal-badge-movora">Movora Cinema (VidLink HD)</span>
              </div>
            </div>
          </div>

          <div className="modal-header-actions">
            {/* Movora Secure Stream Badge */}
            <div 
              className={`ad-shield-badge active ${isVip ? 'vip-stream-badge' : ''}`}
              style={isVip ? { borderColor: '#eab308', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' } : {}}
              title={isVip ? "عضوية Movora VIP نشطة: حظر شامل لكافة الإعلانات والنوافذ المنبثقة 👑" : "درع موفورا الذكي: حظر الإعلانات الإباحية والنوافذ المنبثقة"}
            >
              {isVip ? <Crown size={14} style={{ color: '#facc15' }} /> : <ShieldCheck size={14} />}
              <span>{isVip ? 'عضوية VIP: بدون إعلانات 👑' : 'درع الحماية نشط 🛡️'}</span>
            </div>

            {/* Prominent Header Close Button */}
            <button 
              className="video-modal-close-btn" 
              onClick={onClose} 
              title="إغلاق المشغل (Esc)"
              aria-label="إغلاق"
            >
              <X size={18} />
              <span className="close-text-label">إغلاق</span>
            </button>
          </div>
        </div>

        {/* Server Switcher Controls */}
        <div className="video-modal-servers">
          <div className="server-label">
            <Server size={15} />
            <span>سيرفر العرض:</span>
          </div>

          <div className="server-buttons-grid">
            <button
              className={`server-btn ${activeServer === 'primary' ? 'active' : ''}`}
              onClick={() => setActiveServer('primary')}
            >
              <Play size={14} />
              سيرفر VidLink (سريع ودقة عالية)
            </button>

            <button
              className={`server-btn ${activeServer === 'secondary' ? 'active' : ''}`}
              onClick={() => setActiveServer('secondary')}
            >
              <Server size={14} />
              سيرفر AutoEmbed
            </button>

            <button
              className={`server-btn ${activeServer === 'server3' ? 'active' : ''}`}
              onClick={() => setActiveServer('server3')}
            >
              <Server size={14} />
              سيرفر MultiEmbed (متعدد)
            </button>

            <button
              className={`server-btn ${activeServer === 'server4' ? 'active' : ''}`}
              onClick={() => setActiveServer('server4')}
            >
              <Server size={14} />
              سيرفر VidSrc (احتياطي)
            </button>

            <button
              className={`server-btn trailer-btn ${activeServer === 'trailer' ? 'active' : ''}`}
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

        {/* Optional Sponsored Banner Slot */}
        <AdBannerSlot slot="player" />

        {/* Player Bottom Info Bar with Subtitle Guidance */}
        <div className="video-modal-footer">
          <div className="player-hint">
            <Languages size={15} style={{ color: '#ff315a', verticalAlign: 'middle', marginLeft: 6, flexShrink: 0 }} />
            <span>
              <strong>الصوت الأساسي: إنجليزي أصلي.</strong> لاختيار أو تفعيل الترجمة للعربية، اضغط على زر الترجمة <strong>(CC أو Subtitles)</strong> داخل المشغل واختر <strong>Arabic</strong>.
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
