import React, { useEffect, useRef } from 'react';
import { getAdSettings } from '../../services/adShield';

export default function AdBannerSlot({ slot = 'player', style = {} }) {
  const containerRef = useRef(null);
  const settings = getAdSettings();

  const isEnabled = settings && settings.enabled;
  const bannerCode = slot === 'player' ? settings.bannerPlayerCode : null;

  useEffect(() => {
    if (!isEnabled || !bannerCode || !containerRef.current) return;

    try {
      containerRef.current.innerHTML = '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = bannerCode;

      const scripts = tempDiv.getElementsByTagName('script');
      Array.from(scripts).forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.src) newScript.src = oldScript.src;
        else newScript.textContent = oldScript.textContent;
        containerRef.current.appendChild(newScript);
      });

      // Also copy non-script elements (e.g. div or a tags)
      Array.from(tempDiv.children).forEach((el) => {
        if (el.tagName !== 'SCRIPT') {
          containerRef.current.appendChild(el.cloneNode(true));
        }
      });
    } catch (err) {
      console.warn('Ad banner render notice:', err);
    }
  }, [isEnabled, bannerCode]);

  if (!isEnabled || !bannerCode || !bannerCode.trim()) {
    return null;
  }

  return (
    <div 
      className="movora-ad-banner-slot" 
      style={{
        margin: '16px auto',
        maxWidth: '100%',
        textAlign: 'center',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '10px',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
    >
      <div 
        style={{
          fontSize: '10px',
          color: '#64748b',
          letterSpacing: '1px',
          marginBottom: '6px',
          textTransform: 'uppercase'
        }}
      >
        إعلان موثوق • Sponsored
      </div>
      <div ref={containerRef} />
    </div>
  );
}
