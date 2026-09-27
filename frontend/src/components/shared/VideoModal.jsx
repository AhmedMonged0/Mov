import React, { useState, useEffect } from 'react';
import { X, Server, Film, Play, Star, ShieldCheck, Languages, Crown, RotateCcw } from 'lucide-react';
import { fetchMovieVideos } from '../../services/tmdb';
import { trackMovieStream } from '../../services/analyticsTracker';
import { isVipActive, subscribeToVip } from '../../services/vipService';
import AdBannerSlot from './AdBannerSlot';
import '../../styles/VideoModal.css';

export default function VideoModal({ movie, initialServer = 'multiembed', onClose }) {
  const [activeServer, setActiveServer] = useState(initialServer); // 'multiembed' | 'primary' | 'autoembed' | 'backup' | 'embed2' | 'trailer'
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

  // Streaming sources with Arabic subtitles as primary default & fallback servers
  const MODAL_SERVERS = [
    {
      id: 'multiembed',
      name: 'سيرفر 1 (ترجمة عربي تلقائية) 🇪🇬',
      title: 'سيرفر MultiEmbed - يترجم للعربية تلقائياً ومتعدد المصادر البديلة',
      url: `https://multiembed.mov/?video_id=${movie.imdb_id || movie.id}&tmdb=1&default_lang=ar`
    },
    {
      id: 'primary',
      name: 'سيرفر 2 (VidLink HD) ⭐',
      title: 'سيرفر VidLink فائق الجودة وسريع',
      url: `https://vidlink.pro/movie/${movie.id}?primaryColor=ff315a&secondaryColor=1e293b`
    },
    {
      id: 'autoembed',
      name: 'سيرفر 3 (AutoEmbed)',
      title: 'سيرفر AutoEmbed السريع',
      url: `https://player.autoembed.cc/embed/movie/${movie.id}`
    },
    {
      id: 'backup',
      name: 'سيرفر 4 (VidSrc)',
      title: 'سيرفر VidSrc الاحتياطي',
      url: `https://vidsrc.me/embed/movie?tmdb=${movie.id}`
    },
    {
      id: 'embed2',
      name: 'سيرفر 5 (2Embed)',
      title: 'سيرفر 2Embed الاحتياطي الإضافي',
      url: `https://www.2embed.cc/embed/${movie.id}`
    },
    {
      id: 'trailer',
      name: 'التريلر (الإعلان)',
      title: 'مشاهدة إعلان الفيلم على يوتيوب',
      url: trailerKey 
        ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0` 
        : 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1'
    }
  ];

  const currentServerObj = MODAL_SERVERS.find(s => s.id === activeServer) || MODAL_SERVERS[0];
  const iframeSrc = currentServerObj.url;

  // Quick switch to next server if current provider shows "We couldn't find this content" or fails
  const handleNextServer = () => {
    const streamServers = MODAL_SERVERS.filter(s => s.id !== 'trailer');
    const currentIndex = streamServers.findIndex(s => s.id === activeServer);
    const nextIndex = (currentIndex + 1) % streamServers.length;
    setActiveServer(streamServers[nextIndex].id);
  };

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
                <span className="modal-badge-movora">Movora Cinema (ترجمة عربي تلقائية)</span>
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
            {MODAL_SERVERS.map(srv => (
              <button
                key={srv.id}
                className={`server-btn ${activeServer === srv.id ? 'active' : ''}`}
                onClick={() => setActiveServer(srv.id)}
                title={srv.title}
              >
                {srv.id === 'trailer' ? <Film size={14} /> : <Server size={14} />}
                {srv.name}
              </button>
            ))}
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

        {/* Smart Server Switcher & Arabic Subtitles Guidance Banner */}
        <div className="player-smart-helper-banner">
          <div className="helper-content">
            <div className="helper-badge">
              <Languages size={14} />
              <span>الترجمة العربية نشطة 🇪🇬</span>
            </div>
            <div className="helper-text">
              <span>
                إذا ظهرت لك رسالة <strong>"We couldn't find this content"</strong> أو تعطل المشغل، اضغط على <strong>تبديل السيرفر</strong> للتغيير لسيرفر بديل فوراً. لتغيير الترجمة اضغط على زر <strong>CC</strong> داخل المشغل.
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="quick-switch-server-btn" 
            onClick={handleNextServer}
            title="التبديل إلى السيرفر البديل التالي فوراً"
          >
            <RotateCcw size={15} />
            <span>تبديل السيرفر 🔄</span>
          </button>
        </div>

        {/* Optional Sponsored Banner Slot */}
        <AdBannerSlot slot="player" />

        {/* Player Bottom Info Bar with Subtitle Guidance */}
        <div className="video-modal-footer">
          <button className="close-bottom-btn" onClick={onClose}>
            إغلاق المشغل
          </button>
        </div>
      </div>
    </div>
  );
}
