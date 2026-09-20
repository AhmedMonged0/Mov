import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, Download, Star, ArrowRight, Film, Clock, Calendar, 
  Server, Languages, ShieldCheck, Share2, Check, Copy, 
  Sparkles, Send, Crown 
} from 'lucide-react';
import { fetchMovieDetails, fetchMovieVideos, getPosterUrl, getBackdropUrl } from '../services/tmdb';
import { trackMovieStream } from '../services/analyticsTracker';
import { updatePageSEO, resetPageSEO } from '../services/seoHelper';
import AdBannerSlot from '../components/shared/AdBannerSlot';
import VipModal from '../components/shared/VipModal';
import { getVipStatus, subscribeToVip } from '../services/vipService';
import '../styles/Details.css';

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentServer, setCurrentServer] = useState('primary'); // 'primary' | 'multiembed' | 'backup' | 'trailer'
  const [trailerKey, setTrailerKey] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipStatus, setVipStatus] = useState(() => getVipStatus());

  useEffect(() => {
    const unsub = subscribeToVip((status) => {
      setVipStatus(status);
    });
    return unsub;
  }, []);

  // Copy movie link to clipboard with feedback
  const handleCopyLink = () => {
    const url = `https://movora.me/movie/${movie?.id || id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const el = document.createElement('input');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {}
  };

  // Track movie stream in analytics when user clicks play
  useEffect(() => {
    if (isPlaying && movie && currentServer !== 'trailer') {
      trackMovieStream(movie, currentServer);
    }
  }, [isPlaying, movie, currentServer]);

  // Prevent third-party iframe from hijacking parent window when playing
  useEffect(() => {
    if (!isPlaying) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPlaying]);

  useEffect(() => {
    const getMovie = async () => {
      setLoading(true);
      setError(null);
      try {
        const movieId = id ? id.split('-')[0] : '';
        if (!movieId) throw new Error('معرف الفيلم غير صالح');

        const [details, videos] = await Promise.all([
          fetchMovieDetails(movieId),
          fetchMovieVideos(movieId),
        ]);

        setMovie(details);

        const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos[0];
        if (trailer && trailer.key) {
          setTrailerKey(trailer.key);
        }
      } catch (err) {
        console.error("Failed to load movie details:", err);
        setError('تعذر تحميل تفاصيل الفيلم. يرجى المحاولة لاحقاً.');
      } finally {
        setLoading(false);
      }
    };
    getMovie();
  }, [id]);

  // Dynamic SEO & Google Structured Data (Schema.org Movie entity)
  useEffect(() => {
    if (!movie) return;

    const movieTitle = movie.title || movie.original_title || 'فيلم';
    const year = movie.release_date ? movie.release_date.split('-')[0] : '';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '7.5';
    const poster = movie.poster_path ? getPosterUrl(movie.poster_path, 'w780') : 'https://movora.me/favicon.svg';
    const backdrop = movie.backdrop_path ? getBackdropUrl(movie.backdrop_path, 'w1280') : poster;
    const genresStr = Array.isArray(movie.genres) ? movie.genres.map(g => g.name).join(', ') : 'أفلام سينما';

    const pageTitle = `مشاهدة وتحميل فيلم ${movieTitle} (${year}) مترجم كامل HD | موفورا Movora`;
    const pageDesc = movie.overview 
      ? `مشاهدة وتحميل فيلم ${movieTitle} (${year}) مترجم كامل أون لاين بجودة عالية 1080p و 4K بدون إعلانات مزعجة. قصة الفيلم: ${movie.overview.slice(0, 160)}...`
      : `مشاهدة وتحميل فيلم ${movieTitle} (${year}) مترجم كامل بجودة فائقة 1080p و 4K بسيرفرات سريعة وبدون إعلانات على موفورا (movora.me).`;

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "Movie",
      "name": movieTitle,
      "alternateName": movie.original_title,
      "description": movie.overview || pageDesc,
      "image": poster,
      "datePublished": movie.release_date || year,
      "genre": Array.isArray(movie.genres) ? movie.genres.map(g => g.name) : ["أفلام"],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": rating,
        "bestRating": "10",
        "worstRating": "1",
        "ratingCount": movie.vote_count || 150
      },
      "potentialAction": {
        "@type": "WatchAction",
        "target": `https://movora.me/movie/${movie.id}`
      }
    };

    updatePageSEO({
      title: pageTitle,
      description: pageDesc,
      keywords: `${movieTitle}, مشاهدة فيلم ${movieTitle}, تحميل فيلم ${movieTitle}, فيلم ${movieTitle} مترجم, فيلم ${movieTitle} ${year}, افلام ${genresStr}, موفورا, movora.me`,
      canonicalUrl: `https://movora.me/movie/${movie.id}`,
      ogType: 'video.movie',
      ogImage: backdrop || poster,
      schema: schemaData
    });

    return () => {
      resetPageSEO();
    };
  }, [movie]);

  if (loading) {
    return (
      <div className="details-page" dir="rtl" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading">جاري تحميل تفاصيل الفيلم...</div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="details-page" dir="rtl" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div className="loading">{error || 'لم يتم العثور على الفيلم'}</div>
        <Link to="/" className="primary" style={{ textDecoration: 'none' }}>
          <ArrowRight size={16} /> العودة إلى الرئيسية
        </Link>
      </div>
    );
  }

  const title = movie.title || movie.original_title || 'فيلم بدون عنوان';
  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'غير محدد';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'غير متوفر';
  const genresStr = movie.genres && movie.genres.length > 0 ? movie.genres.map(g => g.name).join(' • ') : 'سينما عالمية';
  
  const backdropUrl = movie.backdrop_path ? getBackdropUrl(movie.backdrop_path, 'original') : '';
  const posterUrl = movie.poster_path ? getPosterUrl(movie.poster_path, 'w500') : null;

  const hours = movie.runtime ? Math.floor(movie.runtime / 60) : 0;
  const minutes = movie.runtime ? movie.runtime % 60 : 0;
  const runtimeStr = movie.runtime ? `${hours > 0 ? `${hours} س ` : ''}${minutes} د` : null;

  // Streaming source url based on server selection (Prioritizing Ad-Free VidLink HD)
  let playerSrc = `https://vidlink.pro/movie/${movie.id}`;
  if (currentServer === 'autoembed') {
    playerSrc = `https://player.autoembed.cc/embed/movie/${movie.id}`;
  } else if (currentServer === 'multiembed') {
    playerSrc = `https://multiembed.mov/?video_id=${movie.id}&tmdb=1`;
  } else if (currentServer === 'backup') {
    playerSrc = `https://vidsrc.me/embed/movie?tmdb=${movie.id}`;
  } else if (currentServer === 'trailer') {
    playerSrc = trailerKey 
      ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0` 
      : 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
  }

  return (
    <div className="details-page" dir="rtl">
      {backdropUrl && (
        <div 
          className="details-backdrop" 
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}
      
      {isPlaying ? (
        <div className="video-player-container">
          <div className="player-header">
            <button className="back-btn" onClick={() => setIsPlaying(false)}>
              <ArrowRight size={20} /> العودة لتفاصيل الفيلم
            </button>
            <div className="server-selector">
              <span><Server size={15} /> السيرفر:</span>
              <button 
                className={currentServer === 'primary' ? 'active' : ''} 
                onClick={() => setCurrentServer('primary')}
                title="سيرفر نقي بدون إعلانات مزعجة وبدقة عالية"
              >
                سيرفر سينما نقي (VidLink HD) ⭐
              </button>
              <button 
                className={currentServer === 'autoembed' ? 'active' : ''} 
                onClick={() => setCurrentServer('autoembed')}
              >
                سيرفر سريع (AutoEmbed)
              </button>
              <button 
                className={currentServer === 'multiembed' ? 'active' : ''} 
                onClick={() => setCurrentServer('multiembed')}
              >
                سيرفر الترجمة (MultiEmbed)
              </button>
              <button 
                className={currentServer === 'backup' ? 'active' : ''} 
                onClick={() => setCurrentServer('backup')}
              >
                سيرفر احتياطي (VidSrc)
              </button>
              <button 
                className={currentServer === 'trailer' ? 'active' : ''} 
                onClick={() => setCurrentServer('trailer')}
              >
                التريلر
              </button>
              {vipStatus.isVip ? (
                <div 
                  className="ad-shield-badge active"
                  title="عضوية VIP: مشاهدة سينمائية نقية 100% بدون إعلانات وبأعلى دقة"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(250, 204, 21, 0.18)',
                    border: '1px solid rgba(250, 204, 21, 0.45)',
                    color: '#facc15',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: '800'
                  }}
                >
                  <Crown size={13} />
                  <span>سينما VIP (بدون إعلانات) 👑</span>
                </div>
              ) : (
                <div 
                  className="ad-shield-badge active"
                  title="درع موفورا الذكي: حظر الإعلانات الإباحية والنوافذ المنبثقة الخبيثة وتوفير الصوت الإنجليزي الأصلي"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    color: '#4ade80',
                    borderRadius: '6px',
                    padding: '5px 9px',
                    fontSize: '11px'
                  }}
                >
                  <ShieldCheck size={13} />
                  <span>درع الحماية نشط 🛡️</span>
                </div>
              )}
            </div>
          </div>
          <div className="iframe-wrapper">
            <iframe
              key={currentServer}
              src={playerSrc}
              title={title}
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              sandbox={vipStatus.isVip ? "allow-forms allow-scripts allow-same-origin allow-presentation allow-fullscreen" : undefined}
            />
          </div>
          {/* Optional Sponsored Banner Slot */}
          <AdBannerSlot slot="player" />
          <div style={{
            background: '#0e1017',
            padding: '10px 18px',
            borderTop: '1px solid #1a1d28',
            fontSize: '12px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Languages size={15} style={{ color: '#ff315a', flexShrink: 0 }} />
            <span>
              <strong style={{ color: '#fff' }}>الصوت الأساسي: إنجليزي أصلي.</strong> لاختيار الترجمة باللغة العربية أو أي لغة، انقر على زر الترجمة <strong style={{ color: '#ff315a' }}>(CC أو Subtitles)</strong> داخل شاشة المشغل ثم اختر <strong style={{ color: '#fff' }}>Arabic</strong>.
            </span>
          </div>

          {/* Upsell VIP Banner for Non-VIP viewers */}
          {!vipStatus.isVip && (
            <div className="details-vip-promo-banner">
              <div className="details-vip-promo-content">
                <Crown size={20} style={{ color: '#facc15', flexShrink: 0 }} />
                <span>هل تريد مشاهدة نقية بدون أي إعلانات نهائياً وبجودة 4K فائقة السرعة؟</span>
              </div>
              <button 
                type="button" 
                className="details-vip-promo-btn"
                onClick={() => setShowVipModal(true)}
              >
                <Sparkles size={14} />
                <span>اشترك في Movora VIP (35 ج) 🚀</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="details-content">
          <div className="details-poster">
            {posterUrl && !imgError ? (
              <img 
                src={posterUrl} 
                alt={title} 
                onError={() => setImgError(true)} 
              />
            ) : (
              <div className="poster-placeholder" style={{ minHeight: '420px', borderRadius: '16px' }}>
                <Film size={48} className="placeholder-film-icon" />
                <span className="placeholder-brand">MOVORA</span>
                <p className="placeholder-title">{title}</p>
                <span className="placeholder-year">{releaseYear}</span>
              </div>
            )}
          </div>
          
          <div className="details-info">
            <div className="details-badge-row">
              <span className="badge-tmdb">جودة سينما 4K</span>
              {movie.vote_average >= 7.5 && <span className="quality" style={{ position: 'static' }}>أعلى تقييم</span>}
            </div>

            <h1>{title}</h1>
            {movie.original_title && movie.original_title !== title && (
              <h3 className="original-title">{movie.original_title}</h3>
            )}

            <div className="details-meta">
              <span><Calendar size={14} style={{ marginLeft: 4 }} /> {releaseYear}</span>
              <span>•</span>
              <span>{genresStr}</span>
              {runtimeStr && (
                <>
                  <span>•</span>
                  <span><Clock size={14} style={{ marginLeft: 4 }} /> {runtimeStr}</span>
                </>
              )}
              <span>•</span>
              <span className="rating"><Star size={14} fill="currentColor" /> {rating} / 10</span>
            </div>
            
            <p className="details-overview">{movie.overview || 'لا يتوفر وصف بالعربية لهذا الفيلم حالياً.'}</p>
            
            <div className="details-actions">
              <button 
                className="primary" 
                style={{ padding: '14px 32px', fontSize: '16px' }}
                onClick={() => setIsPlaying(true)}
              >
                <Play size={20} fill="currentColor" /> بدء المشاهدة الفورية
              </button>

              {/* WhatsApp Share Button */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `🍿 سهرة الليلة: شاهد فيلم ${title} (${releaseYear}) بجودة عالية 1080p مجاناً وبدون إعلانات مزعجة على موفورا:\nhttps://movora.me/movie/${movie.id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-share"
                title="شارك الفيلم مع أصدقائك عبر واتساب"
              >
                <Share2 size={17} />
                <span>واتساب 🟢</span>
              </a>

              {/* Fast Copy Link Button */}
              <button
                type="button"
                className={`btn-copy-link ${copiedLink ? 'copied' : ''}`}
                onClick={handleCopyLink}
                title="نسخ رابط الفيلم المباشر"
              >
                {copiedLink ? (
                  <>
                    <Check size={17} style={{ color: '#4ade80' }} />
                    <span style={{ color: '#4ade80' }}>تم النسخ! ✓</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>نسخ الرابط 📋</span>
                  </>
                )}
              </button>

              <a
                href="https://t.me/movora_me"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tg-channel"
                title="انضم لقناة موفورا الرسمية"
              >
                <span>قناة التليجرام 📢</span>
              </a>
            </div>

            {/* Downloads Coming Soon Section */}
            <div className="downloads-coming-soon-card">
              <div className="dl-coming-icon-wrap">
                <Download size={22} />
              </div>
              <div className="dl-coming-content">
                <div className="dl-coming-badge">
                  <Sparkles size={13} />
                  <span>ميزة جديدة • قريباً</span>
                </div>
                <h3>سيتم إضافة خيار التحميل قريباً 🚀</h3>
                <p>
                  نعمل حالياً على تجهيز روابط تنزيل مباشرة وسريعة لكافة الأعمال السينمائية.
                  يمكنك الاستمتاع حالياً ببدء المشاهدة الفورية بجودة 4K وبدون إعلانات عبر زر المشاهدة أعلاه!
                </p>
              </div>
              <a
                href="https://t.me/movora_me"
                target="_blank"
                rel="noopener noreferrer"
                className="dl-coming-tg-btn"
                title="انضم لقناة موفورا على تليجرام"
              >
                <Send size={15} />
                <span>قناتنا على تليجرام 📢</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* VIP Modal */}
      <VipModal 
        isOpen={showVipModal}
        onClose={() => setShowVipModal(false)}
      />
    </div>
  );
}
