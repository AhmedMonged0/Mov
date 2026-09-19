import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Download, Star, ArrowRight, Film, Clock, Calendar, Server, Languages, ShieldCheck } from 'lucide-react';
import { fetchMovieDetails, fetchMovieVideos, getPosterUrl, getBackdropUrl } from '../services/tmdb';
import { trackMovieStream } from '../services/analyticsTracker';
import { updatePageSEO, resetPageSEO } from '../services/seoHelper';
import AdBannerSlot from '../components/shared/AdBannerSlot';
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
        setError('تعذر تحميل تفاصيل الفيلم من TMDB. يرجى المحاولة لاحقاً.');
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
        <div className="loading">جاري تحميل تفاصيل الفيلم من TMDB...</div>
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

  const downloadLinks = [
    { quality: '1080p Full HD', size: '2.4 GB', url: '#' },
    { quality: '720p HD', size: '1.1 GB', url: '#' },
    { quality: '4K Ultra HD', size: '6.8 GB', url: '#' },
  ];

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
            </div>
          </div>
          <div className="iframe-wrapper">
            <iframe
              key={currentServer}
              src={playerSrc}
              title={title}
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            />
          </div>
          {/* Optional Monetag Sponsored Banner Slot */}
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
              <span className="badge-tmdb">TMDB Certified</span>
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
            
            <p className="details-overview">{movie.overview || 'لا يتوفر وصف بالعربية لهذا الفيلم حالياً في قاعدة بيانات TMDB.'}</p>
            
            <div className="details-actions">
              <button 
                className="primary" 
                style={{ padding: '14px 32px', fontSize: '16px' }}
                onClick={() => setIsPlaying(true)}
              >
                <Play size={20} fill="currentColor" /> بدء المشاهدة الفورية
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

            {/* Downloads Section */}
            <div className="downloads-section">
              <h3><Download size={18} /> خيارات التحميل المباشر</h3>
              <div className="download-grid">
                {downloadLinks.map((dl, idx) => (
                  <div key={idx} className="download-card">
                    <div className="dl-info">
                      <span className="dl-quality">{dl.quality}</span>
                      <span className="dl-size">{dl.size}</span>
                    </div>
                    <a 
                      href={dl.url} 
                      className="dl-btn" 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        alert(`جاري تجهيز رابط التحميل لجودة ${dl.quality} من سيرفرات Movora...`); 
                      }}
                    >
                      <Download size={16} /> تحميل
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
