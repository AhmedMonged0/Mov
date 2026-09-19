import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ 
  size = 'medium', 
  showDomain = true, 
  showBadge = false,
  badgeText = 'CINEMA',
  clickable = true,
  className = '' 
}) {
  // Dimensions based on size prop
  const dimensions = {
    small: { iconSize: 28, fontSize: '20px', domainSize: '10px' },
    medium: { iconSize: 34, fontSize: '24px', domainSize: '11px' },
    large: { iconSize: 44, fontSize: '30px', domainSize: '12px' }
  }[size] || { iconSize: 34, fontSize: '24px', domainSize: '11px' };

  const logoContent = (
    <div 
      className={`movora-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        userSelect: 'none'
      }}
    >
      {/* High-End Futuristic Cinematic SVG Icon */}
      <div 
        className="logo-icon-wrapper"
        style={{
          width: dimensions.iconSize,
          height: dimensions.iconSize,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <svg 
          viewBox="0 0 100 100" 
          width={dimensions.iconSize} 
          height={dimensions.iconSize}
          style={{
            filter: 'drop-shadow(0 0 12px rgba(255, 49, 90, 0.45))',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <defs>
            <linearGradient id="movoraBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff315a" />
              <stop offset="45%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="movoraPlayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffd2dc" />
            </linearGradient>
            <radialGradient id="movoraGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff315a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ff315a" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer Rounded Shield Frame */}
          <rect 
            x="4" 
            y="4" 
            width="92" 
            height="92" 
            rx="24" 
            fill="#0b0c10" 
            stroke="rgba(255, 255, 255, 0.12)" 
            strokeWidth="2.5" 
          />
          <circle cx="50" cy="50" r="38" fill="url(#movoraGlow)" />

          {/* Geometric Futuristic "M" Monogram */}
          <path 
            d="M26 72 V30 L50 51 L74 30 V72 H62 V45.5 L50 56 L38 45.5 V72 Z" 
            fill="url(#movoraBrandGrad)" 
          />

          {/* Embedded Cinema Play Prism */}
          <polygon 
            points="46,45 57,51 46,57" 
            fill="url(#movoraPlayGrad)" 
            opacity="0.95" 
          />

          {/* Accent Cyber Dot */}
          <circle cx="75" cy="69" r="4" fill="#06b6d4" />
        </svg>
      </div>

      {/* Typography Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span 
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: dimensions.fontSize,
              fontWeight: 900,
              letterSpacing: '1px',
              color: '#ffffff',
              background: 'linear-gradient(180deg, #ffffff 30%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase'
            }}
          >
            MOVORA
          </span>
          <span 
            style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#ff315a',
              boxShadow: '0 0 8px #ff315a',
              alignSelf: 'baseline'
            }} 
          />
          {showBadge && (
            <span
              className="logo-badge-pill"
              style={{
                fontSize: '9px',
                fontWeight: 800,
                color: '#ff315a',
                background: 'rgba(255, 49, 90, 0.12)',
                border: '1px solid rgba(255, 49, 90, 0.3)',
                padding: '2px 5px',
                borderRadius: '4px',
                marginRight: '4px',
                letterSpacing: '1px'
              }}
            >
              {badgeText}
            </span>
          )}
        </div>

        {showDomain && (
          <span 
            className="logo-domain-label"
            style={{
              fontSize: dimensions.domainSize,
              color: '#64748b',
              fontWeight: 600,
              letterSpacing: '0.8px',
              fontFamily: 'monospace',
              marginTop: '2px'
            }}
          >
            movora.me
          </span>
        )}
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link to="/" title="Movora - منصة الأفلام والمسلسلات الرائدة (movora.me)" style={{ textDecoration: 'none' }}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
