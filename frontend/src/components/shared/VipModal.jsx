import React, { useState, useEffect, useRef } from 'react';
import { 
  Crown, 
  X, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Film, 
  Copy, 
  Check, 
  Send, 
  KeyRound, 
  AlertCircle,
  Loader2,
  Clock,
  Share2,
  Gift,
  Flame,
  Bookmark,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { 
  getVipStatus, 
  redeemVipCode, 
  subscribeToVip, 
  verifyVipWithCloud,
  activateFreeTrial,
  addVipHours,
  getReferralCode,
  getReferralLink,
  getWheelStatus,
  recordWheelSpin,
  getCompletedQuests,
  claimQuestReward
} from '../../services/vipService';
import '../../styles/VipModal.css';

const WHEEL_PRIZES = [
  { label: '+24 ساعة VIP 🎁', shortLabel: '24 ساعة', hours: 24, color: '#ff315a', textColor: '#ffffff' },
  { label: '+12 ساعة VIP ⚡', shortLabel: '12 ساعة', hours: 12, color: '#0ea5e9', textColor: '#ffffff' },
  { label: '+48 ساعة VIP 🌟', shortLabel: '48 ساعة', hours: 48, color: '#eab308', textColor: '#0f172a' },
  { label: '+6 ساعات VIP 🍿', shortLabel: '6 ساعات', hours: 6, color: '#10b981', textColor: '#ffffff' },
  { label: '+7 أيام ذهبية 👑', shortLabel: '7 أيام', hours: 168, color: '#ec4899', textColor: '#ffffff' },
  { label: '+24 ساعة ثانية ✨', shortLabel: '24 ساعة', hours: 24, color: '#8b5cf6', textColor: '#ffffff' }
];

export default function VipModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('trial'); // 'trial' | 'wheel' | 'redeem'
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [vipStatus, setVipStatus] = useState(() => getVipStatus());
  
  // Lucky wheel states
  const [wheelAngle, setWheelAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState(null);
  const [wheelStatus, setWheelStatus] = useState(() => getWheelStatus());
  const [completedQuests, setCompletedQuests] = useState(() => getCompletedQuests());

  useEffect(() => {
    const unsub = subscribeToVip((status) => {
      setVipStatus(status);
    });
    return unsub;
  }, []);

  // Sync state and check cloud status on open
  useEffect(() => {
    if (isOpen) {
      setVipStatus(getVipStatus());
      setWheelStatus(getWheelStatus());
      setCompletedQuests(getCompletedQuests());
      setFeedback(null);
      setCode('');
      setWheelResult(null);

      verifyVipWithCloud().then((fresh) => {
        if (fresh) {
          setVipStatus(fresh);
          if (fresh.isRevoked) {
            setFeedback({
              type: 'error',
              message: 'تنبيه: تم إلغاء كود التفعيل السابق. يمكنك الاستمتاع بالتجربة المجانية أو الأنشطة أدناه.'
            });
          }
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const myRefCode = getReferralCode();
  const myRefLink = getReferralLink();

  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2200);
    }
  };

  // 1-Click Activate Free 24h Trial
  const handleActivateTrial = () => {
    const res = activateFreeTrial();
    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'ألف مبروك! تم تفعيل تجربتك المجانية لمدة 24 ساعة بنجاح 🍿 جاري تنظيف كافة الإعلانات...'
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  // Lucky Spin Wheel Action
  const handleSpinWheel = () => {
    if (isSpinning) return;
    const status = getWheelStatus();
    if (!status.canSpin) {
      const hoursLeft = Math.ceil(status.nextSpinInMs / (1000 * 60 * 60));
      setFeedback({
        type: 'error',
        message: `لقد قمت بلف العجلة اليوم! يمكنك لفها مرة أخرى بعد حوالي ${hoursLeft} ساعة ⏳`
      });
      return;
    }

    setIsSpinning(true);
    setFeedback(null);
    setWheelResult(null);

    // Pick weighted target index
    const rand = Math.random();
    let targetIndex = 0;
    if (rand < 0.35) targetIndex = 0;       // +24h
    else if (rand < 0.65) targetIndex = 1;  // +12h
    else if (rand < 0.85) targetIndex = 3;  // +6h
    else if (rand < 0.95) targetIndex = 2;  // +48h
    else targetIndex = 4;                   // +7 days!

    const sliceAngle = 360 / WHEEL_PRIZES.length; // 60 deg
    // Calculate final rotation so the top pointer lands squarely on targetIndex
    const extraRounds = 5 * 360; // 5 full spins
    const targetSliceCenter = (targetIndex * sliceAngle) + (sliceAngle / 2);
    // Negative rotation or inverted angle to align with pointer at top (0 deg)
    const newAngle = wheelAngle + extraRounds + (360 - (targetSliceCenter % 360));

    setWheelAngle(newAngle);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = WHEEL_PRIZES[targetIndex];
      recordWheelSpin(prize.hours);
      setWheelStatus(getWheelStatus());
      setWheelResult(prize);
      setFeedback({
        type: 'success',
        message: `🎉 ألف مبروك! ربحت ${prize.label}! تم تمديد فترة مشاهدتك بدون إعلانات فوراً ✨`
      });
    }, 4200);
  };

  // Quests Action (WhatsApp, Telegram, Bookmark)
  const handleQuest = (questId, hours = 24) => {
    if (questId === 'whatsapp_share') {
      const shareMsg = `🍿 جبتلك موقع موفورا Movora الجديد لمشاهدة أحدث الأفلام والمسلسلات بجودة 4K وبدون أي إعلانات نهائياً! ادخل وجرب هديتك المجانية (24 ساعة) من هنا:\n${myRefLink}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`, '_blank');
      claimQuestReward('whatsapp_share', hours);
      setCompletedQuests(getCompletedQuests());
      setFeedback({
        type: 'success',
        message: `شكراً لمشاركتك موفورا! تم إضافة +${hours} ساعة VIP مجاناً لحسابك 🎁`
      });
    } else if (questId === 'telegram_channel') {
      window.open('https://t.me/movora_me', '_blank');
      claimQuestReward('telegram_channel', hours);
      setCompletedQuests(getCompletedQuests());
      setFeedback({
        type: 'success',
        message: `أهلاً بك في قناة موفورا على تليجرام! تم إضافة +${hours} ساعة VIP لحسابك 📢`
      });
    } else if (questId === 'bookmark_site') {
      claimQuestReward('bookmark_site', hours);
      setCompletedQuests(getCompletedQuests());
      setFeedback({
        type: 'success',
        message: `تم حفظ موفورا! تم إضافة +${hours} ساعة VIP مجاناً لحسابك ⭐`
      });
    }
  };

  // Manual Promo Code Redeem
  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setFeedback({ type: 'error', message: 'يرجى إدخال رمز الكود أولاً' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const res = await redeemVipCode(code.trim());
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ 
        type: 'success', 
        message: `${res.message} جاري تحديث الصفحة للتفعيل الكامل... ✨` 
      });
      setCode('');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      setFeedback({ type: 'error', message: res.error });
    }
  };

  // Format wheel countdown
  const formatWheelCountdown = () => {
    if (wheelStatus.canSpin) return null;
    const hours = Math.floor(wheelStatus.nextSpinInMs / (1000 * 60 * 60));
    const mins = Math.floor((wheelStatus.nextSpinInMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} ساعة و ${mins} دقيقة`;
  };

  return (
    <div className="vip-modal-overlay" onClick={onClose}>
      <div className="vip-modal-dialog" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="vip-modal-header">
          <div className="vip-header-title-wrap">
            <div className="vip-crown-icon-wrap">
              <Crown size={26} />
            </div>
            <div>
              <h2>نادي موفورا VIP (سينما بدون إعلانات) 👑</h2>
              <p>تجربة مجانية 24 ساعة + فعاليات يومية لكسب أيام وساعات غير محدودة</p>
            </div>
          </div>
          <button className="vip-close-btn" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="vip-modal-tabs">
          <button 
            type="button" 
            className={`vip-tab-btn ${activeTab === 'trial' ? 'active' : ''}`}
            onClick={() => { setActiveTab('trial'); setFeedback(null); }}
          >
            <Gift size={16} />
            <span>التجربة والمكافآت 🎁</span>
          </button>

          <button 
            type="button" 
            className={`vip-tab-btn ${activeTab === 'wheel' ? 'active' : ''}`}
            onClick={() => { setActiveTab('wheel'); setFeedback(null); }}
          >
            <Sparkles size={16} />
            <span>عجلة الحظ اليومية 🎡</span>
          </button>

          <button 
            type="button" 
            className={`vip-tab-btn ${activeTab === 'redeem' ? 'active' : ''}`}
            onClick={() => { setActiveTab('redeem'); setFeedback(null); }}
          >
            <KeyRound size={16} />
            <span>معاك كود هدية؟ 🔑</span>
          </button>
        </div>

        <div className="vip-modal-body">
          {/* Feedback Messages */}
          {feedback && (
            <div className={`vip-feedback ${feedback.type}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* =========================================================
              TAB 1: FREE TRIAL & VIRAL REWARDS (تنشيط ودعوة الأصدقاء)
              ========================================================= */}
          {activeTab === 'trial' && (
            <div className="vip-trial-container">
              
              {/* STATUS CARD */}
              {vipStatus.isVip ? (
                /* USER IS ALREADY ACTIVE VIP */
                <div className="vip-active-card">
                  <div className="vip-active-card-glow" />
                  <div className="vip-active-header">
                    <div className="vip-active-badge-pill">
                      <Crown size={14} />
                      <span>اشتراكك نشط الآن 👑</span>
                    </div>
                    <span className="vip-active-plan-title">
                      {vipStatus.planName || 'عضوية سينمائية بدون إعلانات'}
                    </span>
                  </div>

                  <div className="vip-countdown-display">
                    <div className="vip-countdown-item">
                      <span className="vip-countdown-num">
                        {vipStatus.remainingDays >= 9000 
                          ? '∞' 
                          : String(vipStatus.remainingHours || 0).padStart(2, '0')}
                      </span>
                      <span className="vip-countdown-lbl">ساعة متبقية</span>
                    </div>
                    <span className="vip-countdown-colon">:</span>
                    <div className="vip-countdown-item">
                      <span className="vip-countdown-num">
                        {vipStatus.remainingDays >= 9000 
                          ? '∞' 
                          : String(vipStatus.remainingMinutes || 0).padStart(2, '0')}
                      </span>
                      <span className="vip-countdown-lbl">دقيقة</span>
                    </div>
                    {vipStatus.remainingDays > 1 && vipStatus.remainingDays < 9000 && (
                      <>
                        <span className="vip-countdown-colon">:</span>
                        <div className="vip-countdown-item">
                          <span className="vip-countdown-num">{vipStatus.remainingDays}</span>
                          <span className="vip-countdown-lbl">أيام إضافية</span>
                        </div>
                      </>
                    )}
                  </div>

                  <p className="vip-active-note">
                    🛡️ جميع الإعلانات والنوافذ المنبثقة محظورة بالكامل، وتعمل سيرفرات 4K الفائقة تلقائياً بدون تقطيع.
                  </p>
                </div>
              ) : (
                /* USER NOT VIP: 1-CLICK FREE 24H TRIAL HERO */
                <div className="vip-free-trial-hero">
                  <div className="vip-trial-hero-glow" />
                  <div className="vip-trial-badge">
                    <Sparkles size={14} />
                    <span>هدية ترحيبية لكل زائر 🎁</span>
                  </div>

                  <h3 className="vip-trial-heading">
                    تجربة مجانية فورية لمدة 24 ساعة! 🚀
                  </h3>
                  <p className="vip-trial-desc">
                    اضغط بالأسفل واستمتع بمشاهدة جميع أفلام ومسلسلات موفورا بدقة 4K فائقة السرعة وبدون أي إعلانات نهائياً بنقرة واحدة!
                  </p>

                  <button
                    type="button"
                    className="vip-activate-trial-btn"
                    onClick={handleActivateTrial}
                  >
                    <Zap size={20} fill="currentColor" />
                    <span>تفعيل الـ 24 ساعة مجاناً فوراً ⚡</span>
                  </button>

                  <div className="vip-perks-mini-row">
                    <div className="vip-perk-mini">
                      <CheckCircle2 size={15} color="#4ade80" />
                      <span>بدون إعلانات 100%</span>
                    </div>
                    <div className="vip-perk-mini">
                      <CheckCircle2 size={15} color="#4ade80" />
                      <span>سيرفرات 4K فائقة السرعة</span>
                    </div>
                    <div className="vip-perk-mini">
                      <CheckCircle2 size={15} color="#4ade80" />
                      <span>شارة سينما VIP</span>
                    </div>
                  </div>
                </div>
              )}

              {/* VIRAL REWARDS SECTION: HOW TO GET MORE DAYS */}
              <div className="vip-viral-section">
                <div className="vip-viral-header">
                  <div className="vip-viral-title-group">
                    <Flame size={20} style={{ color: '#ff315a' }} />
                    <h4>كيف تكسب أيام وساعات VIP إضافية مجاناً؟ 🔥</h4>
                  </div>
                  <span className="vip-viral-sub">
                    قم بالأنشطة التالية لتمديد اشتراكك بدون أي تكاليف
                  </span>
                </div>

                <div className="vip-quests-grid">
                  {/* Quest 1: WhatsApp Referral Share */}
                  <div className="vip-quest-card featured">
                    <div className="vip-quest-badge-tag">+24 ساعة مجاناً 🎁</div>
                    <div className="vip-quest-info">
                      <div className="vip-quest-icon whatsapp">
                        <Share2 size={18} />
                      </div>
                      <div>
                        <h5>دعوة الأصدقاء عبر واتساب 📲</h5>
                        <p>شارك رابط موفورا الخاص بك في جروبات وأصدقاء واتساب واكسب يوم كامل (+24 ساعة) فوراً!</p>
                      </div>
                    </div>

                    <div className="vip-ref-box">
                      <span className="vip-ref-label">رابط دعوتك الخاص:</span>
                      <div className="vip-ref-input-row">
                        <span className="vip-ref-link-text">{myRefLink}</span>
                        <button
                          type="button"
                          className={`vip-ref-copy-btn ${copiedField === 'ref' ? 'copied' : ''}`}
                          onClick={() => {
                            handleCopy(myRefLink, 'ref');
                            if (!completedQuests.includes('copy_referral')) {
                              claimQuestReward('copy_referral', 24);
                              setCompletedQuests(getCompletedQuests());
                              setFeedback({
                                type: 'success',
                                message: 'تم نسخ الرابط وإضافة +24 ساعة VIP مجاناً لحسابك 🎁'
                              });
                            }
                          }}
                        >
                          {copiedField === 'ref' ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedField === 'ref' ? 'تم النسخ!' : 'نسخ'}</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="vip-quest-cta-btn whatsapp"
                      onClick={() => handleQuest('whatsapp_share', 24)}
                    >
                      <Share2 size={16} />
                      <span>مشاركة فورية على واتساب (+24 ساعة) 🟢</span>
                    </button>
                  </div>

                  {/* Quest 2: Telegram Channel Join */}
                  <div className="vip-quest-card">
                    <div className="vip-quest-badge-tag">+24 ساعة مجاناً 📢</div>
                    <div className="vip-quest-info">
                      <div className="vip-quest-icon telegram">
                        <Send size={18} />
                      </div>
                      <div>
                        <h5>الانضمام لقناة موفورا الرسمية على تليجرام</h5>
                        <p>انضم لقناتنا لمتابعة سهرات الليلة والأفلام الحصرية وأكواد VIP الدورية.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`vip-quest-cta-btn telegram ${completedQuests.includes('telegram_channel') ? 'completed' : ''}`}
                      onClick={() => handleQuest('telegram_channel', 24)}
                    >
                      {completedQuests.includes('telegram_channel') ? (
                        <>
                          <Check size={16} />
                          <span>تم الانضمام وكسب +24 ساعة ✓</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>انضم للقناة واكسب +24 ساعة 📢</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quest 3: Add to Bookmarks / Home Screen */}
                  <div className="vip-quest-card">
                    <div className="vip-quest-badge-tag">+12 ساعة مجاناً ⭐</div>
                    <div className="vip-quest-info">
                      <div className="vip-quest-icon bookmark">
                        <Bookmark size={18} />
                      </div>
                      <div>
                        <h5>حفظ موقع موفورا في المفضلة</h5>
                        <p>احفظ الموقع في مفضلة المتصفح أو أضفه للشاشة الرئيسية للوصول السريع بدون إعلانات.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`vip-quest-cta-btn secondary ${completedQuests.includes('bookmark_site') ? 'completed' : ''}`}
                      onClick={() => handleQuest('bookmark_site', 12)}
                    >
                      {completedQuests.includes('bookmark_site') ? (
                        <>
                          <Check size={16} />
                          <span>تم حفظ الموقع وكسب +12 ساعة ✓</span>
                        </>
                      ) : (
                        <>
                          <Bookmark size={16} />
                          <span>حفظ الموقع في المفضلة (+12 ساعة) ⭐</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: LUCKY SPIN WHEEL (عجلة الحظ اليومية الدوارة)
              ========================================================= */}
          {activeTab === 'wheel' && (
            <div className="vip-wheel-container">
              <div className="vip-wheel-header-intro">
                <h3>عجلة الحظ السينمائية اليومية 🎡</h3>
                <p>لف العجلة مرة كل 24 ساعة واربح ساعات وأيام VIP فورية مجاناً تضاف لحسابك مباشرة!</p>
              </div>

              {/* WHEEL COMPONENT */}
              <div className="vip-wheel-wrapper">
                {/* Pointer / Needle */}
                <div className="vip-wheel-pointer">
                  <div className="vip-pointer-triangle" />
                </div>

                {/* Rotating Wheel Disc */}
                <div 
                  className="vip-wheel-disc"
                  style={{ 
                    transform: `rotate(${wheelAngle}deg)`,
                    transition: isSpinning ? 'transform 4.2s cubic-bezier(0.12, 0.9, 0.2, 1)' : 'none'
                  }}
                >
                  {WHEEL_PRIZES.map((prize, idx) => {
                    const rotateDeg = idx * 60;
                    return (
                      <div
                        key={idx}
                        className="vip-wheel-slice"
                        style={{
                          transform: `rotate(${rotateDeg}deg)`
                        }}
                      >
                        <div 
                          className="vip-slice-content"
                          style={{
                            background: `linear-gradient(180deg, ${prize.color} 0%, rgba(10, 15, 25, 0.95) 100%)`,
                            color: prize.textColor
                          }}
                        >
                          <span className="vip-slice-text">{prize.shortLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Center Hub Logo */}
                <div className="vip-wheel-center-hub" onClick={handleSpinWheel}>
                  <Crown size={22} color="#facc15" />
                  <span style={{ fontSize: '10px', fontWeight: 900, color: '#fff' }}>MOVORA</span>
                </div>
              </div>

              {/* SPIN ACTION BUTTON & COOLDOWN */}
              <div className="vip-wheel-action-wrap">
                {wheelStatus.canSpin ? (
                  <button
                    type="button"
                    className="vip-spin-btn"
                    onClick={handleSpinWheel}
                    disabled={isSpinning}
                  >
                    {isSpinning ? (
                      <>
                        <Loader2 size={18} className="search-spinner" />
                        <span>العجلة تدور الآن... ترقب جائزتك! 🍀</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>لف العجلة واكسب ساعتك المجانية 🎡</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="vip-wheel-cooldown-box">
                    <Clock size={16} color="#facc15" />
                    <span>
                      لقد قمت بلف العجلة اليوم! العجلة القادمة متاحة بعد: <strong>{formatWheelCountdown()}</strong> ⏳
                    </span>
                  </div>
                )}
              </div>

              {/* Result Celebration */}
              {wheelResult && (
                <div className="vip-wheel-win-alert">
                  <Sparkles size={20} color="#facc15" />
                  <div>
                    <strong>مبروك يا بطل! كسبت {wheelResult.label} 🥳</strong>
                    <p>تم إضافة الساعات إلى رصيد حسابك فوراً، استمتع بأقوى الأفلام بدون إعلانات!</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB 3: REDEEM GIFT CODE (إدخال كود هدية)
              ========================================================= */}
          {activeTab === 'redeem' && (
            <div className="vip-redeem-container">
              <div className="vip-redeem-lead-box">
                <KeyRound size={22} color="#facc15" />
                <p>
                  هل حصلت على كود هدية أو كود VIP خاص من مسابقات قناة التليجرام؟ أدخل رمز الكود بالأسفل لتفعيله فوراً على جهازك:
                </p>
              </div>

              <form onSubmit={handleRedeem}>
                <div className="vip-input-wrap">
                  <input 
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="مثال: VIP-MOV-98A4X"
                    className="vip-code-input"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    className="vip-redeem-btn"
                    disabled={isSubmitting || !code.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="search-spinner" />
                        <span>جاري الفحص...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>تفعيل الكود</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Telegram Drop Hint */}
              <div className="vip-telegram-hint-card">
                <div>
                  <h4>ليس لديك كود؟ انضم لقناتنا 📢</h4>
                  <p>نقوم بتوزيع أكواد VIP مجانية دورية في قناة موفورا على تليجرام للمتابعين المتفاعلين.</p>
                </div>
                <a 
                  href="https://t.me/movora_me" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="vip-telegram-sub-btn"
                >
                  <Send size={15} />
                  <span>انضم للقناة الآن</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
