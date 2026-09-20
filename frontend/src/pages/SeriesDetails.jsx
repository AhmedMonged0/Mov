import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Tv, 
  Play, 
  Star, 
  Calendar, 
  Clock, 
  Layers, 
  ShieldCheck, 
  Languages, 
  SkipForward, 
  SkipBack, 
  ChevronLeft, 
  ChevronRight, 
  Server, 
  Share2, 
  Check, 
  Loader2,
  Crown
} from 'lucide-react';
import { 
  fetchSeriesDetails, 
  fetchSeasonDetails, 
  getPosterUrl, 
  getBackdropUrl 
} from '../services/tmdb';
import { updatePageSEO, resetPageSEO } from '../services/seoHelper';
import { isVipActive, subscribeToVip } from '../services/vipService';
import AdBannerSlot from '../components/shared/AdBannerSlot';
import '../styles/Series.css';

const SERVERS = [
  { id: 'vidlink', name: 'سيرفر VidLink (سريع ودقة عالية) ⭐', url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
  { id: 'autoembed', name: 'سيرفر AutoEmbed', url: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` },
  { id: 'multiembed', name: 'سيرفر MultiEmbed (متعدد)', url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}` },
  { id: 'vidsrc', name: 'سيرفر VidSrc (احتياطي)', url: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
  { id: '2embed', name: 'سيرفر 2Embed', url: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` }
];

export default function SeriesDetails() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected season & episode
  const initialSeason = parseInt(searchParams.get('season'), 10) || 1;
  const initialEpisode = parseInt(searchParams.get('ep'), 10) || 1;

  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [seasonData, setSeasonData] = useState(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Current server
  const [currentServer, setCurrentServer] = useState('vidlink');
  const [isCopied, setIsCopied] = useState(false);
  const [isVip, setIsVip] = useState(() => isVipActive());

  const playerRef = useRef(null);

  useEffect(() => {
    return subscribeToVip((status) => {
      setIsVip(!!status.isVip);
    });
  }, []);

  // Fetch Series Details
  useEffect(() => {
    let isMounted = true;
    const loadSeries = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSeriesDetails(id);
        if (isMounted) {
          setSeries(data);

          // Determine first valid season
          const validSeasons = (data.seasons || []).filter(s => s.season_number > 0);
          const initialS = validSeasons.some(s => s.season_number === initialSeason)
            ? initialSeason
            : (validSeasons[0]?.season_number || 1);

          setCurrentSeason(initialS);
        }
      } catch (err) {
        if (isMounted) {
          setError('تعذر تحميل بيانات المسلسل، يرجى المحاولة مرة أخرى.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSeries();
    return () => { isMounted = false; };
  }, [id]);

  // Fetch Episodes for selected Season
  useEffect(() => {
    let isMounted = true;
    const loadEpisodes = async () => {
      if (!id || !currentSeason) return;
      setLoadingEpisodes(true);
      try {
        const sData = await fetchSeasonDetails(id, currentSeason);
        if (isMounted) {
          setSeasonData(sData);
        }
      } catch (err) {
        console.error('Failed to load season details:', err);
      } finally {
        if (isMounted) setLoadingEpisodes(false);
      }
    };

    loadEpisodes();
    return () => { isMounted = false; };
  }, [id, currentSeason]);

  // Update SEO
  useEffect(() => {
    if (series) {
      const title = series.name || series.original_name || 'مسلسل';
      updatePageSEO({
        title: `مشاهدة مسلسل ${title} الموسم ${currentSeason} الحلقة ${currentEpisode} مترجم - Movora`,
        description: series.overview || `شاهد مسلسل ${title} أونلاين بجودة عالية HD وسيرفرات سريعة على Movora TV.`,
        keywords: `${title}, مسلسل ${title}, مشاهدة مسلسل ${title}, حلقات ${title}, مسلسلات مترجمة`
      });
    }
    return () => resetPageSEO();
  }, [series, currentSeason, currentEpisode]);

  // Handle Season switch
  const handleSelectSeason = (seasonNum) => {
    setCurrentSeason(seasonNum);
    setCurrentEpisode(1);
    setSearchParams({ season: String(seasonNum), ep: '1' });
  };

  // Handle Episode selection
  const handleSelectEpisode = (epNum) => {
    setCurrentEpisode(epNum);
    setSearchParams({ season: String(currentSeason), ep: String(epNum) });

    // Smooth scroll to player on mobile
    if (playerRef.current && window.innerWidth < 768) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Next Episode handler
  const handleNextEpisode = () => {
    const episodesList = seasonData?.episodes || [];
    if (currentEpisode < episodesList.length) {
      handleSelectEpisode(currentEpisode + 1);
    } else {
      // Check if next season exists
      const nextSeasonNum = currentSeason + 1;
      const hasNextSeason = (series?.seasons || []).some(s => s.season_number === nextSeasonNum);
      if (hasNextSeason) {
        handleSelectSeason(nextSeasonNum);
      }
    }
  };

  // Previous Episode handler
  const handlePrevEpisode = () => {
    if (currentEpisode > 1) {
      handleSelectEpisode(currentEpisode - 1);
    } else if (currentSeason > 1) {
      // Go to previous season
      handleSelectSeason(currentSeason - 1);
    }
  };

  // Share link
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        <Loader2 size={42} className="search-spinner" style={{ color: '#ff315a', marginBottom: 16 }} />
        <p style={{ fontSize: '16px', fontWeight: 700 }}>جاري تحضير المسلسل والحلقات...</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px' }}>
        <Tv size={56} style={{ color: '#ff315a', marginBottom: 16 }} />
        <h2 style={{ color: '#fff', fontSize: '22px', marginBottom: 10 }}>عذراً، حدث خطأ أثناء جلب المسلسل</h2>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>{error || 'لم نتمكن من العثور على المسلسل المطلوب.'}</p>
        <button className="ep-nav-btn" onClick={() => navigate('/series')}>
          العودة لقسم المسلسلات 📺
        </button>
      </div>
    );
  }

  const title = series.name || series.original_name || 'مسلسل';
  const releaseYear = series.first_air_date ? series.first_air_date.split('-')[0] : '';
  const rating = series.vote_average ? Number(series.vote_average).toFixed(1) : null;
  const poster = getPosterUrl(series.poster_path, 'w500');
  const backdrop = getBackdropUrl(series.backdrop_path, 'original');

  // Filter regular seasons (exclude Specials/Season 0 for cleaner tabs)
  const availableSeasons = (series.seasons || []).filter(s => s.season_number > 0);
  const currentEpisodesList = seasonData?.episodes || [];
  const currentEpisodeObj = currentEpisodesList.find(e => e.episode_number === currentEpisode);

  // Active player source
  const serverConfig = SERVERS.find(s => s.id === currentServer) || SERVERS[0];
  const playerSrc = serverConfig.url(series.id, currentSeason, currentEpisode);

  const isFirstEpisode = currentSeason === 1 && currentEpisode === 1;
  const isLastEpisode = 
    currentSeason === availableSeasons[availableSeasons.length - 1]?.season_number && 
    currentEpisode === currentEpisodesList.length;

  return (
    <div className="series-details-page">
      {/* Backdrop */}
      {backdrop && (
        <div 
          className="series-backdrop" 
          style={{ backgroundImage: `url(${backdrop})` }} 
        />
      )}

      <div className="series-content-wrap">
        {/* Header Hero Section */}
        <div className="series-header-info">
          <div className="series-poster-box">
            {poster ? (
              <img src={poster} alt={title} />
            ) : (
              <div style={{ width: '100%', height: '340px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <Tv size={48} />
              </div>
            )}
          </div>

          <div className="series-meta-info">
            <h1>{title}</h1>
            {series.original_name && series.original_name !== title && (
              <div className="series-original-name">{series.original_name}</div>
            )}

            <div className="series-badges-bar">
              {rating && (
                <div className="series-badge rating">
                  <Star size={13} fill="#facc15" />
                  <span>{rating}</span>
                </div>
              )}

              {releaseYear && (
                <div className="series-badge year">
                  <Calendar size={13} />
                  <span>{releaseYear}</span>
                </div>
              )}

              <div className="series-badge seasons">
                <Layers size={13} />
                <span>{availableSeasons.length} مواسم</span>
              </div>

              {series.status && (
                <div className="series-badge status">
                  <span>{series.status === 'Ended' ? 'مكتمل' : 'مستمر'}</span>
                </div>
              )}

              {(series.genres || []).map(g => (
                <div key={g.id} className="series-badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}>
                  {g.name}
                </div>
              ))}
            </div>

            {series.overview && (
              <div className="series-overview">
                {series.overview}
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                className="ep-nav-btn"
                onClick={handleShare}
                title="مشاركة رابط المسلسل"
              >
                {isCopied ? <Check size={14} color="#22c55e" /> : <Share2 size={14} />}
                <span>{isCopied ? 'تم نسخ الرابط!' : 'مشاركة المسلسل'}</span>
              </button>

              <Link to="/series" className="ep-nav-btn" style={{ background: 'transparent' }}>
                <ChevronRight size={14} />
                <span>المزيد من المسلسلات</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ================= TV Player Section ================= */}
        <div className="series-player-section" ref={playerRef}>
          {/* Player Header Bar */}
          <div className="series-player-header">
            <div className="series-player-current-title">
              <span className="current-ep-pill">الموسم {currentSeason} • الحلقة {currentEpisode}</span>
              <span>{currentEpisodeObj?.name || `الحلقة ${currentEpisode}`}</span>
            </div>

            {/* Episode Navigation Buttons */}
            <div className="episode-nav-controls">
              <button
                className="ep-nav-btn"
                onClick={handlePrevEpisode}
                disabled={isFirstEpisode}
                title="الحلقة السابقة"
              >
                <SkipBack size={14} />
                <span>السابقة</span>
              </button>

              <button
                className="ep-nav-btn"
                onClick={handleNextEpisode}
                disabled={isLastEpisode}
                title="الحلقة التالية"
                style={{ background: '#ff315a', borderColor: '#ff315a' }}
              >
                <span>التالية</span>
                <SkipForward size={14} />
              </button>

              {/* VIP / Protection Badge */}
              <div 
                className="series-badge"
                style={isVip ? { background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' } : { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}
              >
                {isVip ? <Crown size={13} style={{ color: '#facc15' }} /> : <ShieldCheck size={13} />}
                <span>{isVip ? 'VIP بدون إعلانات 👑' : 'درع الحماية نشط 🛡️'}</span>
              </div>
            </div>
          </div>

          {/* Video Iframe Frame */}
          <div className="series-iframe-wrapper">
            <iframe
              key={`${currentServer}-${id}-${currentSeason}-${currentEpisode}`}
              src={playerSrc}
              title={`${title} - الموسم ${currentSeason} الحلقة ${currentEpisode}`}
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            />
          </div>

          {/* Optional Sponsored Banner Slot */}
          <AdBannerSlot slot="player" />

          {/* Subtitle guidance hint */}
          <div style={{
            background: '#0a0d16',
            padding: '10px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '12px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Languages size={15} style={{ color: '#ff315a', flexShrink: 0 }} />
            <span>
              <strong style={{ color: '#fff' }}>الصوت الأساسي: إنجليزي أصلي.</strong> لتفعيل أو تغيير الترجمة للعربية، انقر على زر الترجمة <strong style={{ color: '#ff315a' }}>(CC أو Subtitles)</strong> داخل شاشة المشغل ثم اختر <strong style={{ color: '#fff' }}>Arabic</strong>.
            </span>
          </div>

          {/* Server Switchers Bar */}
          <div className="series-server-bar">
            <div className="series-server-label">
              <Server size={14} />
              <span>سيرفر الحلقة:</span>
            </div>
            <div className="series-server-buttons">
              {SERVERS.map(srv => (
                <button
                  key={srv.id}
                  className={`series-server-btn ${currentServer === srv.id ? 'active' : ''}`}
                  onClick={() => setCurrentServer(srv.id)}
                >
                  {srv.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= Season & Episodes Section ================= */}
        <div className="season-episodes-section">
          <div className="season-section-header">
            <h2 className="season-section-title">
              <Layers size={20} style={{ color: '#ff315a' }} />
              <span>قائمة الحلقات والمواسم</span>
            </h2>

            {/* Season Selector Tabs */}
            <div className="season-selector-tabs">
              {availableSeasons.map((s) => {
                const isActive = s.season_number === currentSeason;
                return (
                  <button
                    key={s.id || s.season_number}
                    className={`season-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectSeason(s.season_number)}
                  >
                    {s.name || `الموسم ${s.season_number}`} ({s.episode_count || '?'} حلقة)
                  </button>
                );
              })}
            </div>
          </div>

          {/* Episodes Grid List */}
          {loadingEpisodes ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <Loader2 size={28} className="search-spinner" style={{ margin: '0 auto 10px', display: 'block', color: '#ff315a' }} />
              <p>جاري تحميل حلقات الموسم {currentSeason}...</p>
            </div>
          ) : currentEpisodesList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
              <p>لم تتوفر معلومات حلقات هذا الموسم حالياً.</p>
            </div>
          ) : (
            <div className="episodes-grid">
              {currentEpisodesList.map((ep) => {
                const isCurrent = ep.episode_number === currentEpisode;
                const still = getBackdropUrl(ep.still_path, 'w500');

                return (
                  <div
                    key={ep.id || ep.episode_number}
                    className={`episode-card ${isCurrent ? 'active' : ''}`}
                    onClick={() => handleSelectEpisode(ep.episode_number)}
                  >
                    <div className="episode-thumbnail-wrap">
                      {still ? (
                        <img src={still} alt={ep.name} loading="lazy" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                          <Tv size={28} />
                        </div>
                      )}

                      <div className="episode-number-badge">
                        حلقة {ep.episode_number}
                      </div>

                      <div className="episode-play-overlay">
                        <Play size={18} fill="currentColor" />
                      </div>
                    </div>

                    <div className="episode-info-box">
                      <div className="episode-title-row">
                        <span className="episode-name" title={ep.name}>
                          {ep.name || `الحلقة ${ep.episode_number}`}
                        </span>
                        {ep.runtime ? (
                          <span className="episode-duration">
                            <Clock size={10} style={{ verticalAlign: 'middle', marginLeft: 2 }} />
                            {ep.runtime} د
                          </span>
                        ) : null}
                      </div>

                      {ep.overview && (
                        <p className="episode-overview-text">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Similar TV Series */}
        {series.similar?.results && series.similar.results.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, marginBottom: '18px', textAlign: 'right' }}>
              مسلسلات مشابهة قد تعجبك 🍿
            </h3>
            <div className="series-grid">
              {series.similar.results.slice(0, 6).map((sim) => {
                const simTitle = sim.name || sim.original_name || 'مسلسل';
                const simPoster = getPosterUrl(sim.poster_path, 'w500');
                const simRating = sim.vote_average ? Number(sim.vote_average).toFixed(1) : null;

                return (
                  <div
                    key={sim.id}
                    className="series-card"
                    onClick={() => {
                      navigate(`/series/${sim.id}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="series-card-poster">
                      {simPoster ? (
                        <img src={simPoster} alt={simTitle} loading="lazy" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#1e293b' }} />
                      )}
                      {simRating && (
                        <div className="series-card-rating">
                          <Star size={11} fill="#facc15" color="#facc15" />
                          <span>{simRating}</span>
                        </div>
                      )}
                    </div>
                    <div className="series-card-info">
                      <h4 className="series-card-title">{simTitle}</h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
