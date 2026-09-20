import React, { useState, useEffect } from 'react';
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
  ChevronLeft
} from 'lucide-react';
import { getVipStatus, redeemVipCode, subscribeToVip, verifyVipWithCloud } from '../../services/vipService';
import '../../styles/VipModal.css';

export default function VipModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'redeem'
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [vipStatus, setVipStatus] = useState(() => getVipStatus());
  const [showExtendCodeForm, setShowExtendCodeForm] = useState(false);

  useEffect(() => {
    const unsub = subscribeToVip((status) => {
      setVipStatus(status);
    });
    return unsub;
  }, []);

  // Reset state and verify cloud status when opened
  useEffect(() => {
    if (isOpen) {
      setVipStatus(getVipStatus());
      setFeedback(null);
      setCode('');
      setShowExtendCodeForm(false);
      verifyVipWithCloud().then((fresh) => {
        if (fresh) {
          setVipStatus(fresh);
          if (fresh.isRevoked) {
            setFeedback({
              type: 'error',
              message: 'تنبيه: تم إلغاء أو حذف كود التفعيل هذا من قِبل إدارة الموقع. يمكنك إدخال كود جديد أدناه.'
            });
          }
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

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
      setFeedback({ type: 'success', message: `${res.message} جاري تحديث الصفحة لتنظيف كافة الإعلانات تماماً... ✨` });
      setCode('');
      setShowExtendCodeForm(false);
      // Clean reload to flush all ad memory
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      setFeedback({ type: 'error', message: res.error });
    }
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
              <h2>عضوية موفورا المميزة (Movora VIP) 👑</h2>
              <p>مشاهدة سينمائية نقية 100% بدون أي إعلانات وبأعلى جودة</p>
            </div>
          </div>
          <button className="vip-close-btn" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        {/* Tabs - Only shown when NOT subscribed, or when extending */}
        {(!vipStatus.isVip || showExtendCodeForm) && (
          <div className="vip-modal-tabs">
            <button 
              type="button" 
              className={`vip-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
              onClick={() => { setActiveTab('plans'); setFeedback(null); }}
            >
              <Sparkles size={16} />
              <span>الباقات ومميزات VIP</span>
            </button>
            <button 
              type="button" 
              className={`vip-tab-btn ${activeTab === 'redeem' ? 'active' : ''}`}
              onClick={() => { setActiveTab('redeem'); setFeedback(null); }}
            >
              <KeyRound size={16} />
              <span>تفعيل كود الاشتراك 🚀</span>
            </button>
          </div>
        )}

        <div className="vip-modal-body">
          {/* 1. DEDICATED SCREEN FOR ALREADY ACTIVE VIP USERS */}
          {vipStatus.isVip && !showExtendCodeForm ? (
            <div className="vip-active-screen" style={{ textAlign: 'center', padding: '10px 0 10px' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '22px',
                background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.25) 0%, rgba(234, 179, 8, 0.1) 100%)',
                border: '1px solid rgba(250, 204, 21, 0.5)',
                color: '#facc15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(250, 204, 21, 0.25)'
              }}>
                <Crown size={36} />
              </div>

              <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                أنت مشترك نشط في Movora VIP! 👑
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#94a3b8' }}>
                حسابك مفعّل ومحمي وتتمتع بمشاهدة سينمائية نقية 100% خالية تماماً من الإعلانات.
              </p>

              {/* Membership details card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                borderRadius: '16px',
                padding: '18px 20px',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '14px',
                textAlign: 'right'
              }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>نوع الباقة:</span>
                  <strong style={{ fontSize: '15px', color: '#facc15' }}>{vipStatus.planName || 'عضوية مميزة'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>رمز الكود المفعل:</span>
                  <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#cbd5e1', fontWeight: 700 }}>
                    {vipStatus.code}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>تاريخ الانتهاء:</span>
                  <strong style={{ fontSize: '14px', color: '#ffffff' }}>
                    {vipStatus.durationDays >= 9000 ? 'مدى الحياة 👑' : new Date(vipStatus.expiresAt).toLocaleDateString('ar-EG')}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>المدة المتبقية:</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#4ade80',
                    fontSize: '13px',
                    fontWeight: 800,
                    background: 'rgba(34, 197, 94, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    <Clock size={12} />
                    {vipStatus.remainingDays >= 9000 ? 'دائم مدى الحياة' : `${vipStatus.remainingDays} يوم`}
                  </span>
                </div>
              </div>

              {/* Verified Perks */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.06)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '14px',
                padding: '14px 18px',
                marginBottom: '22px',
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
                color: '#cbd5e1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
                  <span>جميع إعلانات الموقع والنوافذ المنبثقة محظورة ومحذوفة بالكامل.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
                  <span>مشغل الأفلام يعمل افتراضياً على سيرفرات 4K فائقة السرعة بدون تقطيع.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
                  <span>شارة العضوية الذهبية VIP مفعلة في كافة صفحات الموقع.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                  color: '#0f172a',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  marginBottom: '14px',
                  boxShadow: '0 4px 20px rgba(250, 204, 21, 0.35)',
                  fontFamily: 'inherit'
                }}
              >
                استمتع بالمشاهدة الآن 🎬
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExtendCodeForm(true);
                  setActiveTab('redeem');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'inherit'
                }}
              >
                لديك كود تفعيل آخر وترغب في تمديد مدة اشتراكك؟ اضغط هنا ➕
              </button>
            </div>
          ) : (
            /* 2. PLANS OR REDEEM VIEW */
            <>
              {/* Return to status button if user is VIP extending */}
              {vipStatus.isVip && showExtendCodeForm && (
                <button
                  type="button"
                  onClick={() => setShowExtendCodeForm(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#facc15',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '16px',
                    fontFamily: 'inherit'
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>العودة لبطاقة العضوية المفعلة</span>
                </button>
              )}

              {/* TAB 1: Plans & Perks */}
              {activeTab === 'plans' && (
                <>
                  {/* VIP Perks */}
                  <div className="vip-perks-grid">
                    <div className="vip-perk-card">
                      <div className="vip-perk-icon">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="vip-perk-info">
                        <h4>بدون أي إعلانات نهائياً</h4>
                        <p>إزالة كاملة للنوافذ المنبثقة، إعلانات البانر، وإعلانات الموقع بنسبة 100%.</p>
                      </div>
                    </div>

                    <div className="vip-perk-card">
                      <div className="vip-perk-icon">
                        <Zap size={20} />
                      </div>
                      <div className="vip-perk-info">
                        <h4>سيرفرات 4K فائقة السرعة</h4>
                        <p>مشاهدة مباشرة بدون تقطيع على سيرفرات سينما VIP المخصصة للمشتركين.</p>
                      </div>
                    </div>

                    <div className="vip-perk-card">
                      <div className="vip-perk-icon">
                        <Crown size={20} />
                      </div>
                      <div className="vip-perk-info">
                        <h4>شارة العضوية الذهبية</h4>
                        <p>مظهر فاخر لحسابك وتجربة فريدة تميزك عن جميع الزوار في المنصة.</p>
                      </div>
                    </div>

                    <div className="vip-perk-card">
                      <div className="vip-perk-icon">
                        <Film size={20} />
                      </div>
                      <div className="vip-perk-info">
                        <h4>أولوية تلبية الطلبات</h4>
                        <p>إضافة أي فيلم أو مسلسل تطلبه على تليجرام خلال ساعات معدودة فوراً.</p>
                      </div>
                    </div>
                  </div>

                  {/* Plans Pricing */}
                  <h3 className="vip-plans-title">
                    <Sparkles size={16} style={{ color: '#facc15' }} />
                    <span>اختر باقة اشتراكك:</span>
                  </h3>
                  <div className="vip-plans-row">
                    <div className="vip-plan-card">
                      <div className="vip-plan-name">باقة شهر</div>
                      <div className="vip-plan-price">35 <span>جنيه</span></div>
                      <div className="vip-plan-desc">30 يوماً مشاهدة بدون إعلانات</div>
                    </div>

                    <div className="vip-plan-card featured">
                      <span className="vip-popular-tag">الأكثر طلباً ⭐</span>
                      <div className="vip-plan-name">باقة 3 شهور</div>
                      <div className="vip-plan-price">90 <span>جنيه</span></div>
                      <div className="vip-plan-desc">وفر 15 جنيه كاملة</div>
                    </div>

                    <div className="vip-plan-card">
                      <div className="vip-plan-name">باقة سنة كاملة</div>
                      <div className="vip-plan-price">280 <span>جنيه</span></div>
                      <div className="vip-plan-desc">توفير سنوي يصل لـ 40%</div>
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  <div className="vip-payment-box">
                    <h4 className="vip-payment-title">طرق الدفع السريع والتحويل (مصر والعالم العربي):</h4>
                    <div className="vip-pay-methods-list">
                      {/* Vodafone Cash */}
                      <div className="vip-pay-method-item">
                        <div className="vip-pay-method-info">
                          <div className="vip-pay-method-icon vodafone">VF</div>
                          <div>
                            <div className="vip-pay-label">فودافون كاش (Vodafone Cash)</div>
                            <div className="vip-pay-value">01027690623</div>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          className={`vip-copy-btn ${copiedField === 'vodafone' ? 'copied' : ''}`}
                          onClick={() => handleCopy('01027690623', 'vodafone')}
                        >
                          {copiedField === 'vodafone' ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedField === 'vodafone' ? 'تم النسخ!' : 'نسخ الرقم'}</span>
                        </button>
                      </div>

                      {/* InstaPay */}
                      <div className="vip-pay-method-item">
                        <div className="vip-pay-method-info">
                          <div className="vip-pay-method-icon instapay">IP</div>
                          <div>
                            <div className="vip-pay-label">إنستاباي (InstaPay)</div>
                            <div className="vip-pay-value">movora@instapay</div>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          className={`vip-copy-btn ${copiedField === 'instapay' ? 'copied' : ''}`}
                          onClick={() => handleCopy('movora@instapay', 'instapay')}
                        >
                          {copiedField === 'instapay' ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedField === 'instapay' ? 'تم النسخ!' : 'نسخ المعرف'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Send Receipt on Telegram */}
                    <a 
                      href="https://t.me/movora_official" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="vip-telegram-cta"
                    >
                      <Send size={18} />
                      <span>أرسل إيصال التحويل على تليجرام واستلم الكود فوراً 🚀</span>
                    </a>
                  </div>
                </>
              )}

              {/* TAB 2: Redeem Promo Code */}
              {activeTab === 'redeem' && (
                <div className="vip-redeem-container">
                  <p className="vip-redeem-lead">
                    هل قمت بالتحويل واستلمت كود التفعيل؟ أدخل رمز الكود الخاص بك بالأسفل لتفعيل وضع المشاهدة بدون إعلانات فوراً على جهازك:
                  </p>

                  <form onSubmit={handleRedeem}>
                    <div className="vip-input-wrap">
                      <input 
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="مثال: VIP-MOV-98A4X"
                        className="vip-code-input"
                        autoFocus
                        disabled={isSubmitting}
                      />
                      <button 
                        type="submit" 
                        className="vip-redeem-btn"
                        disabled={isSubmitting || !code.trim()}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="spin" />
                            <span>جاري التحقق...</span>
                          </>
                        ) : (
                          <>
                            <Crown size={16} />
                            <span>تفعيل الحساب الآن</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {feedback && (
                    <div className={`vip-feedback-alert ${feedback.type}`}>
                      {feedback.type === 'success' ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <AlertCircle size={18} />
                      )}
                      <span>{feedback.message}</span>
                    </div>
                  )}

                  {/* Instructions on how to get a code */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    fontSize: '13px',
                    color: '#94a3b8',
                    lineHeight: '1.7'
                  }}>
                    <strong style={{ color: '#facc15', display: 'block', marginBottom: '6px' }}>
                      💡 ليس لديك كود تفعيل حتى الآن؟
                    </strong>
                    يمكنك الحصول على كودك الفوري في أقل من دقيقة عبر تحويل قيمة الباقة إلى فودافون كاش أو إنستاباي، ثم إرسال سكرين شوت عبر تليجرام.
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('plans')}
                      style={{
                        display: 'inline-block',
                        marginRight: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#facc15',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                        fontFamily: 'inherit'
                      }}
                    >
                      عرض طرق الدفع والتحويل
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
