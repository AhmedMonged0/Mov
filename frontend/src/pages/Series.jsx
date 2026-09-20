import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Tv, Star, Flame, Sparkles, Radio, Calendar, Layers, ChevronLeft, Loader2 } from 'lucide-react';
import { 
  fetchPopularSeries, 
  fetchTopRatedSeries, 
  fetchOnTheAirSeries, 
  fetchSeriesByGenre, 
  TV_GENRES, 
  getPosterUrl 
} from '../services/tmdb';
import { updatePageSEO, resetPageSEO } from '../services/seoHelper';
import '../styles/Series.css';

export default function Series() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentTab = searchParams.get('type') || 'popular'; // 'popular' | 'top_rated' | 'on_the_air'
  const currentGenre = searchParams.get('genre') || 'all';

  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Update SEO Meta Tags
  useEffect(() => {
    let title = 'مسلسلات أجنبية وعربية أونلاين';
    if (currentTab === 'top_rated') title = 'أفضل المسلسلات الأعلى تقييماً';
    else if (currentTab === 'on_the_air') title = 'مسلسلات تُعرض حالياً على الهواء';

    updatePageSEO({
      title: `${title} - موفورا Movora TV`,
      description: 'شاهد أحدث المسلسلات التلفزيونية والأنمي بدقة عالية وسيرفرات سريعة ومترجمة على منصة Movora.',
      keywords: 'مسلسلات, مسلسلات أجنبية, مسلسلات مترجمة, أنمي, مشاهدة مسلسلات, Movora TV'
    });

    return () => resetPageSEO();
  }, [currentTab]);

  // Load series on tab or genre change
  useEffect(() => {
    const loadSeries = async () => {
      setLoading(true);
      setPage(1);
      try {
        let results = [];
        if (currentGenre !== 'all') {
          results = await fetchSeriesByGenre(currentGenre, 1);
        } else if (currentTab === 'top_rated') {
          results = await fetchTopRatedSeries(1);
        } else if (currentTab === 'on_the_air') {
          results = await fetchOnTheAirSeries(1);
        } else {
          results = await fetchPopularSeries(1);
        }

        setSeriesList(results || []);
        setHasMore((results || []).length >= 18);
      } catch (err) {
        console.error('Failed to load TV series:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSeries();
  }, [currentTab, currentGenre]);

  // Load next page
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      let nextResults = [];
      if (currentGenre !== 'all') {
        nextResults = await fetchSeriesByGenre(currentGenre, nextPage);
      } else if (currentTab === 'top_rated') {
        nextResults = await fetchTopRatedSeries(nextPage);
      } else if (currentTab === 'on_the_air') {
        nextResults = await fetchOnTheAirSeries(nextPage);
      } else {
        nextResults = await fetchPopularSeries(nextPage);
      }

      if (nextResults && nextResults.length > 0) {
        setSeriesList(prev => [...prev, ...nextResults]);
        setPage(nextPage);
        setHasMore(nextResults.length >= 18);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more TV series:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleTabChange = (tabKey) => {
    setSearchParams({ type: tabKey, genre: 'all' });
  };

  const handleGenreChange = (genreId) => {
    setSearchParams({ type: currentTab, genre: String(genreId) });
  };

  return (
    <div className="series-page">
      {/* Hero Banner */}
      <div className="series-hero-banner">
        <div className="series-hero-content">
          <div className="series-hero-badge">
            <Tv size={14} />
            <span>عالم المسلسلات الحصرية • Movora Series</span>
          </div>
          <h1>دليلك لمشاهدة أقوى المسلسلات التلفزيونية والأنمي 🍿</h1>
          <p>
            مواسم وحلقات كاملة مترجمة بأعلى جودة وسيرفرات فائقة السرعة مع إمكانية التنقل بين الحلقات والمواسم بسلاسة تامة.
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="series-nav-tabs">
        <button
          className={`series-tab-btn ${currentTab === 'popular' && currentGenre === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('popular')}
        >
          <Flame size={16} />
          <span>المسلسلات الشائعة</span>
        </button>

        <button
          className={`series-tab-btn ${currentTab === 'top_rated' && currentGenre === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('top_rated')}
        >
          <Star size={16} />
          <span>الأعلى تقييماً</span>
        </button>

        <button
          className={`series-tab-btn ${currentTab === 'on_the_air' && currentGenre === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('on_the_air')}
        >
          <Radio size={16} />
          <span>يُعرض حالياً (حلقات جديدة)</span>
        </button>
      </div>

      {/* Genre Filter Pills */}
      <div className="series-genre-pills">
        {TV_GENRES.map((g) => {
          const isSelected = String(g.id) === String(currentGenre);
          return (
            <button
              key={g.id}
              className={`series-genre-pill ${isSelected ? 'active' : ''}`}
              onClick={() => handleGenreChange(g.id)}
            >
              {g.name}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton / State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <Loader2 size={36} className="search-spinner" style={{ margin: '0 auto 16px', display: 'block', color: '#ff315a' }} />
          <p style={{ fontSize: '15px', fontWeight: 600 }}>جاري تحميل المسلسلات...</p>
        </div>
      ) : seriesList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <Tv size={48} style={{ color: '#475569', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>لم يتم العثور على مسلسلات في هذا التصنيف</h3>
          <p>جرب اختيار تصنيف آخر أو تصفح المسلسلات الشائعة.</p>
        </div>
      ) : (
        <>
          {/* Series Cards Grid */}
          <div className="series-grid">
            {seriesList.map((series) => {
              const title = series.name || series.original_name || 'مسلسل';
              const year = series.first_air_date ? series.first_air_date.split('-')[0] : '';
              const rating = series.vote_average ? Number(series.vote_average).toFixed(1) : null;
              const poster = getPosterUrl(series.poster_path, 'w500');

              return (
                <div
                  key={series.id}
                  className="series-card"
                  onClick={() => navigate(`/series/${series.id}`)}
                  title={`مشاهدة مسلسل ${title}`}
                >
                  <div className="series-card-poster">
                    {poster ? (
                      <img src={poster} alt={title} loading="lazy" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b', color: '#64748b' }}>
                        <Tv size={32} />
                      </div>
                    )}

                    {rating && (
                      <div className="series-card-rating">
                        <Star size={11} fill="#facc15" color="#facc15" />
                        <span>{rating}</span>
                      </div>
                    )}

                    <div className="series-seasons-badge">
                      <Layers size={11} style={{ verticalAlign: 'middle', marginLeft: 3 }} />
                      <span>مسلسل</span>
                    </div>
                  </div>

                  <div className="series-card-info">
                    <h3 className="series-card-title">{title}</h3>
                    <div className="series-card-meta">
                      {year && <span>{year}</span>}
                      <span style={{ color: '#ff315a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        مشاهدة <ChevronLeft size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                className="ep-nav-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{ padding: '12px 30px', fontSize: '15px', borderRadius: '12px' }}
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="search-spinner" />
                    <span>جاري جلب المزيد...</span>
                  </>
                ) : (
                  <span>تحميل المزيد من المسلسلات 📺</span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
