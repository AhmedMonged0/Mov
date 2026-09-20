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
  Clock
} from 'lucide-react';
import { getVipStatus, redeemVipCode, subscribeToVip } from '../../services/vipService';
import '../../styles/VipModal.css';

export default function VipModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'redeem'
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [vipStatus, setVipStatus] = useState(() => getVipStatus());

  useEffect(() => {
    const unsub = subscribeToVip((status) => {
      setVipStatus(status);
    });
    return unsub;
  }, []);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setVipStatus(getVipStatus());
      setFeedback(null);
      setCode('');
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
      setFeedback({ type: 'error', message: 'يرجى كتابة رمز الكود أولاً' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const res = await redeemVipCode(code.trim());
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setCode('');
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

        {/* Tabs */}
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

        <div className="vip-modal-body">
          {/* Active VIP Badge if already subscribed */}
          {vipStatus.isVip && (
            <div className="vip-active-banner">
              <div className="vip-active-content">
                <h3>
                  <CheckCircle2 size={18} />
                  <span>أنت مشترك نشط في Movora VIP!</span>
                </h3>
                <p>
                  نوع الباقة: <strong>{vipStatus.planName}</strong> • ينتهي في: {new Date(vipStatus.expiresAt).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <div className="vip-days-badge">
                <Clock size={13} style={{ display: 'inline', marginLeft: 4 }} />
                {vipStatus.remainingDays >= 9000 ? 'مدى الحياة' : `متبقي ${vipStatus.remainingDays} يوم`}
              </div>
            </div>
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

        </div>

      </div>
    </div>
  );
}
