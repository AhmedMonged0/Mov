import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Clock, 
  Zap, 
  Crown, 
  Check, 
  X, 
  Sparkles, 
  Info,
  ChevronDown
} from 'lucide-react';
import { 
  getWelcomeGiftTracker, 
  subscribeToGiftTracker, 
  claim12HourGift, 
  dismissGiftBar, 
  restoreGiftBar 
} from '../../services/vipService';
import '../../styles/WelcomeGiftBar.css';

export default function WelcomeGiftBar({ onOpenVipModal }) {
  const [tracker, setTracker] = useState(() => getWelcomeGiftTracker());
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Subscribe to changes in gift status
  useEffect(() => {
    const unsub = subscribeToGiftTracker((fresh) => {
      setTracker(fresh);
    });
    return unsub;
  }, []);

  // Live timer tick every 1000ms
  useEffect(() => {
    const updateTimer = () => {
      const current = getWelcomeGiftTracker();
      const now = Date.now();

      if (current.status === 'waiting') {
        const ms = Math.max(0, current.unlockAt - now);
        if (ms <= 0) {
          setTracker({ ...current, status: 'ready' });
          return;
        }
        const h = String(Math.floor(ms / (1000 * 60 * 60))).padStart(2, '0');
        const m = String(Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const s = String(Math.floor((ms % (1000 * 60)) / 1000)).padStart(2, '0');
        setTimeLeftStr(`${h}:${m}:${s}`);
      } else if (current.status === 'active' && current.activeUntil) {
        const ms = Math.max(0, current.activeUntil - now);
        if (ms <= 0) {
          setTracker({ ...current, status: 'expired' });
          return;
        }
        const h = String(Math.floor(ms / (1000 * 60 * 60))).padStart(2, '0');
        const m = String(Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const s = String(Math.floor((ms % (1000 * 60)) / 1000)).padStart(2, '0');
        setTimeLeftStr(`${h}:${m}:${s}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tracker.status]);

  if (!tracker || tracker.status === 'hidden') return null;

  // Claim 12h VIP
  const handleClaim = () => {
    setIsClaiming(true);
    setTimeout(() => {
      claim12HourGift();
      setIsClaiming(false);
      window.location.reload();
    }, 600);
  };

  // If dismissed by user, render a small floating mini-badge at top corner
  if (tracker.dismissed) {
    return (
      <button 
        type="button"
        className="welcome-gift-mini-pill"
        onClick={restoreGiftBar}
        title="إظهار شريط الهدية الترحيبية"
        dir="rtl"
      >
        <Gift size={14} className="gift-pulse-icon" />
        <span>هدية الـ 12 ساعة VIP</span>
        {timeLeftStr && <span className="mini-pill-timer">{timeLeftStr}</span>}
      </button>
    );
  }

  return (
    <>
      <div className={`welcome-gift-bar ${tracker.status}`} dir="rtl">
        <div className="gift-bar-content">
          
          {/* Status 1: Waiting (Countdown to unlocking the 12h VIP gift) */}
          {tracker.status === 'waiting' && (
            <div className="gift-bar-msg-wrap">
              <div className="gift-badge-icon">
                <Gift size={16} className="gift-pulse-icon" />
              </div>
              <div className="gift-text-group">
                <span className="gift-highlight">هدية ترحيبية خاصة 🎁:</span>
                <span className="gift-desc">
                  ستحصل على <strong>12 ساعة VIP سينما مجاناً</strong> بدون أي إعلانات بعد انتهاء العداد:
                </span>
              </div>
              <div className="gift-live-timer" title="الوقت المتبقي لفتح هديتك">
                <Clock size={13} />
                <span className="timer-digits">{timeLeftStr || '23:59:59'}</span>
              </div>
              <button 
                type="button" 
                className="gift-info-link"
                onClick={() => setShowInfoModal(true)}
              >
                <Info size={13} />
                <span>تفاصيل الهدية</span>
              </button>
            </div>
          )}

          {/* Status 2: Ready to Claim (Countdown completed!) */}
          {tracker.status === 'ready' && (
            <div className="gift-bar-msg-wrap ready">
              <div className="gift-badge-icon ready">
                <Sparkles size={16} />
              </div>
              <div className="gift-text-group">
                <span className="gift-highlight">🎉 هديتك الترحيبية جاهزة الآن!</span>
                <span className="gift-desc">
                  يمكنك الآن تفعيل <strong>12 ساعة VIP مجانية</strong> ومشاهدة جميع الأفلام بدون إعلانات نهائياً وبأعلى دقة 4K:
                </span>
              </div>
              <button 
                type="button" 
                className="gift-claim-btn"
                onClick={handleClaim}
                disabled={isClaiming}
              >
                <Zap size={14} fill="currentColor" />
                <span>{isClaiming ? 'جاري التفعيل...' : 'استلام الـ 12 ساعة مجاناً ⚡'}</span>
              </button>
            </div>
          )}

          {/* Status 3: Active (User is enjoying their 12 hours) */}
          {tracker.status === 'active' && (
            <div className="gift-bar-msg-wrap active">
              <div className="gift-badge-icon active">
                <Crown size={15} />
              </div>
              <div className="gift-text-group">
                <span className="gift-highlight">👑 وضع سينما VIP نشط (بدون إعلانات):</span>
                <span className="gift-desc">
                  أنت تتمتع الآن بهديتك الترحيبية المجانية. متبقي في فترتك الذهبية:
                </span>
              </div>
              <div className="gift-live-timer active">
                <Clock size={13} />
                <span className="timer-digits">{timeLeftStr || '11:59:59'}</span>
              </div>
            </div>
          )}

          {/* Status 4: Expired (12 hours finished) */}
          {tracker.status === 'expired' && (
            <div className="gift-bar-msg-wrap expired">
              <div className="gift-badge-icon expired">
                <Crown size={14} />
              </div>
              <div className="gift-text-group">
                <span className="gift-highlight">انتهت الهدية الترحيبية 🍿</span>
                <span className="gift-desc">
                  نتمنى أن تكون استمتعت بالمشاهدة النقية! لمواصلة المشاهدة بدون إعلانات تصفح باقات موفورا المميزة:
                </span>
              </div>
              {onOpenVipModal && (
                <button 
                  type="button" 
                  className="gift-vip-modal-btn"
                  onClick={onOpenVipModal}
                >
                  <span>باقات VIP (35 ج) 👑</span>
                </button>
              )}
            </div>
          )}

          {/* Dismiss / Minimize button */}
          <button 
            type="button" 
            className="gift-bar-close-btn"
            onClick={dismissGiftBar}
            title="تصغير الشريط"
            aria-label="إغلاق أو تصغير"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Mini Details Popup / Dialog */}
      {showInfoModal && (
        <div className="gift-info-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="gift-info-card" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="gift-info-header">
              <div className="gift-info-icon">
                <Gift size={22} />
              </div>
              <h3>ما هي الهدية الترحيبية؟ 🎁</h3>
              <button className="gift-info-close" onClick={() => setShowInfoModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="gift-info-body">
              <p>
                أهلاً بك في منصة <strong>موفورا (Movora)</strong>! تقديراً لزيارتك وتواجدك معنا، ستحصل تلقائياً على:
              </p>
              <div className="gift-perks-list">
                <div className="gift-perk-item">
                  <Check size={16} color="#4ade80" />
                  <span><strong>12 ساعة كاملة VIP مجاناً</strong> بدون أي اشتراك أو دفع.</span>
                </div>
                <div className="gift-perk-item">
                  <Check size={16} color="#4ade80" />
                  <span><strong>إزالة كاملة لجميع الإعلانات 100%</strong> والنوافذ المنبثقة المزعجة.</span>
                </div>
                <div className="gift-perk-item">
                  <Check size={16} color="#4ade80" />
                  <span><strong>سيرفرات 4K فائقة السرعة</strong> بدون أي تقطيع نهائياً.</span>
                </div>
              </div>
              <p className="gift-timer-note">
                ⏳ بمجرد أن يصل العداد التنازلي إلى <strong>00:00:00</strong> (بعد يوم من زيارتك الأولى)، سيظهر لك زر التفعيل الفوري للاستمتاع بـ 12 ساعة سينما ممتعة!
              </p>
            </div>
            <button 
              type="button" 
              className="gift-info-confirm-btn"
              onClick={() => setShowInfoModal(false)}
            >
              فهمت ذلك، استمرار في التصفح 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}
