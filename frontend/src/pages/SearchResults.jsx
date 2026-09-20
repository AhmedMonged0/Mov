import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { X, Search, Film, ArrowRight } from 'lucide-react';
import MovieCard from '../components/shared/MovieCard';
import VideoModal from '../components/shared/VideoModal';
import { searchMovies } from '../services/tmdb';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!query.trim()) {
        setMovies([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await searchMovies(query.trim());
        setMovies(data);
      } catch (err) {
        console.error(err);
        setError('حدث خطأ أثناء جلب نتائج البحث. يرجى المحاولة لاحقاً.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [query]);

  return (
    <div className="content" style={{ paddingTop: '120px' }} dir="rtl">
      <div className="section-head">
        <div>
          <span className="section-kicker">MOVORA SEARCH</span>
          <h2>نتائج البحث عن: <span style={{ color: '#ff315a' }}>"{query}"</span></h2>
        </div>

        {/* زر إلغاء البحث والعودة */}
        <Link 
          to="/" 
          className="cancel-search-pill" 
          style={{ textDecoration: 'none' }}
        >
          <X size={16} /> إلغاء البحث والعودة
        </Link>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-poster"></div>
              <div className="skeleton-title"></div>
              <div className="skeleton-meta"></div>
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <Film size={44} className="empty-icon" />
          <h3>لم يتم العثور على أي فيلم يطابق "{query}"</h3>
          <p>تأكد من كتابة اسم الفيلم بشكل صحيح أو ابحث بكلمات أخرى.</p>
          <button 
            className="primary" 
            onClick={() => navigate('/')} 
            style={{ marginTop: '20px' }}
          >
            <ArrowRight size={16} /> العودة للأفلام الشائعة
          </button>
        </div>
      ) : (
        <div className="movie-grid">
          {movies.map(movie => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              onMovieClick={(m) => setSelectedMovie(m)} 
            />
          ))}
        </div>
      )}

      {/* Video Streaming Modal */}
      {selectedMovie && (
        <VideoModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
        />
      )}
    </div>
  );
}
