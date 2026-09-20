import React, { useState, useEffect } from 'react';
import { ShieldAlert, Crown, X } from 'lucide-react';
import { isVipActive, subscribeToVip } from '../../services/vipService';
import VipModal from './VipModal';

export default function AntiAdblockBanner() {
  const [adblockDetected, setAdblockDetected] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [isVip, setIsVip] = useState(() => isVipActive());

  useEffect(() => {
    const unsub = subscribeToVip((status) => {
      setIsVip(status.isVip);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isVip || dismissed) return;

    // Check if dismissed previously in session
    if (sessionStorage.getItem('movora_adblock_dismissed')) {
      return;
    }

    const timer = setTimeout(() => {
      // Test bait element with classic ad classes
      const bait = document.createElement('div');
      bait.className = 'adsbox pub_300x250 text-ad ad-placement';
      bait.style.position = 'absolute';
      bait.style.left = '-9999px';
      bait.style.width = '1px';
      bait.style.height = '1px';
      document.body.appendChild(bait);

      setTimeout(() => {
        const isBlocked = 
          bait.offsetParent === null || 
          bait.offsetHeight === 0 || 
          bait.offsetLeft === 0 || 
          window.getComputedStyle(bait).display === 'none';

        if (isBlocked && !isVipActive()) {
          setAdblockDetected(true);
        }
        bait.remove();
      }, 300);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isVip, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setAdblockDetected(false);
    sessionStorage.setItem('movora_adblock_dismissed', 'true');
  };

  if (isVip || !adblockDetected || dismissed) return null;

  return (
    <>
      <div 
        dir="rtl"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          left: '20px',
          maxWidth: '540px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(20, 24, 38, 0.96) 0%, rgba(10, 13, 20, 0.98) 100%)',
          border: '1px solid rgba(250, 204, 21, 0.35)',
          borderRadius: '16px',
          padding: '14px 18px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(250, 204, 21, 0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          backdropFilter: 'blur(10px)',
          animation: 'vipSlideUp 0.3s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(250, 204, 21, 0.15)',
            border: '1px solid rgba(250, 204, 21, 0.4)',
            color: '#facc15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Crown size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff' }}>
              تستخدم مانع إعلانات؟ احصل على تجربة VIP كاملة 👑
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              اشترك في Movora VIP وشاهد كافة الأفلام بدقة 4K وبدون أي إعلانات نهائياً ودعم الموقع!
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowVipModal(true)}
            style={{
              background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
              color: '#0f172a',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit'
            }}
          >
            تجربة VIP مجانية (24 ساعة) 🎁
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="إغلاق"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <VipModal 
        isOpen={showVipModal} 
        onClose={() => setShowVipModal(false)} 
      />
    </>
  );
}
