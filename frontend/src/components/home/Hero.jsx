import React from 'react';
import { Play, Plus, Star } from 'lucide-react';
import { getBackdropUrl } from '../../services/tmdb';
import '../../styles/Hero.css';

export default function Hero({ featured, onWatchClick }) {
  if (!featured) return null;

  const title = featured.title || featured.original_title || 'فيلم مميز';

  const backdropUrl = featured.backdrop_path 
    ? getBackdropUrl(featured.backdrop_path, 'original') 
    : (featured.backdrop || '');

  const year = featured.release_date ? featured.release_date.split('-')[0] : (featured.year || '2026');
  const rating = featured.vote_average ? featured.vote_average.toFixed(1) : (featured.rating || '8.5');

  return (
    <section 
      className="hero" 
      style={{ backgroundImage: `url(${backdropUrl})` }}
      dir="rtl"
    >
      <div className="hero-content">
        <div className="eyebrow">MOVORA ORIGINAL</div>
        <h1>{title}</h1>
        <p>{featured.overview || featured.description || 'استمتع بمشاهدة أحدث وأقوى الأعمال السينمائية العالمية بدقة فائقة وترجمة احترافية حصرية عبر Movora.'}</p>
        
        <div className="hero-buttons">
          <button 
            className="primary" 
            onClick={() => onWatchClick && onWatchClick(featured)}
            title="بدء تشغيل الفيلم فوراً"
          >
            <Play size={18} fill="currentColor" /> مشاهدة الآن
          </button>
          <button className="secondary" onClick={() => alert('تمت إضافة الفيلم إلى قائمتك المفضلة')}>
            <Plus size={18} /> قائمتي
          </button>
        </div>

        <div className="hero-meta">
          <span>{year}</span>
          <span>•</span>
          <span className="hero-rating">
            <Star size={14} fill="currentColor" /> {rating}
          </span>
          <span>•</span>
          <span className="badge-tmdb">TMDB Official</span>
        </div>
      </div>
    </section>
  );
}
