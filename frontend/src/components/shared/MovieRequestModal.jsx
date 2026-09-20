import React, { useState, useEffect } from 'react';
import { X, Film, Send, CheckCircle2, Loader2, Sparkles, Clapperboard, Calendar, MessageSquare, AtSign } from 'lucide-react';
import { submitMovieRequest } from '../../services/analyticsTracker';
import '../../styles/MovieRequestModal.css';

export default function MovieRequestModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [notes, setNotes] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('يرجى كتابة اسم الفيلم المطلوب');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await submitMovieRequest({
        title: title.trim(),
        year: year.trim(),
        notes: notes.trim(),
        contact: contact.trim(),
      });

      if (res && res.success) {
        setSubmitted(true);
      } else {
        setError(res?.error || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة ثانية');
      }
    } catch (err) {
      setError('تعذر إرسال الطلب، تأكد من الاتصال بالإنترنت');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setTitle('');
    setYear('');
    setNotes('');
    setContact('');
    setSubmitted(false);
    setError(null);
  };

  return (
    <div className="movie-request-backdrop" onClick={onClose} dir="rtl">
      <div 
        className="movie-request-modal" 
        onClick={(e) => e.stopPropagation()} 
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="req-modal-header">
          <div className="req-modal-title-group">
            <div className="req-modal-icon-badge">
              <Clapperboard size={20} />
            </div>
            <div>
              <h3>طلب فيلم أو مسلسل 🎬</h3>
              <p>مش لاقي فيلمك المفضل؟ اكتبه هنا وهنوفره لك بأعلى جودة فوراً!</p>
            </div>
          </div>
          <button 
            type="button" 
            className="req-modal-close" 
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="req-modal-success">
            <div className="success-icon-wrap">
              <CheckCircle2 size={48} />
            </div>
            <h4>تم استلام طلبك بنجاح! 🍿</h4>
            <p className="success-movie-name">
              تم تسجيل فيلم <strong>"{title}"</strong> في قائمة أولويات الموقع.
            </p>
            <p className="success-hint">
              سيتم رفعه وتجهيزه بسيرفرات فائقة السرعة بدون إعلانات مزعجة. سنعلن فور توفره عبر قناتنا الرسمية على تليجرام!
            </p>

            <div className="success-actions">
              <a 
                href="https://t.me/movora_me" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tg-join-btn"
              >
                <Send size={16} />
                <span>تابع قناتنا لمعرفة توفره فوراً 📢</span>
              </a>
              <div className="success-sub-actions">
                <button 
                  type="button" 
                  className="req-another-btn"
                  onClick={handleResetForAnother}
                >
                  طلب فيلم آخر 🎬
                </button>
                <button 
                  type="button" 
                  className="req-close-btn"
                  onClick={onClose}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="req-modal-form">
            {error && (
              <div className="req-form-error">
                <span>{error}</span>
              </div>
            )}

            <div className="req-form-group">
              <label htmlFor="req-title">
                <Film size={14} />
                <span>اسم الفيلم المطلوب *</span>
              </label>
              <input
                id="req-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: Inception أو سبايدرمان الجديد..."
                required
                autoFocus
              />
            </div>

            <div className="req-form-row">
              <div className="req-form-group">
                <label htmlFor="req-year">
                  <Calendar size={14} />
                  <span>سنة الإصدار (اختياري)</span>
                </label>
                <input
                  id="req-year"
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="مثال: 2024"
                />
              </div>

              <div className="req-form-group">
                <label htmlFor="req-contact">
                  <AtSign size={14} />
                  <span>حساب تليجرام أو بريدك (اختياري)</span>
                </label>
                <input
                  id="req-contact"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="مثال: @username لإشعارك"
                />
              </div>
            </div>

            <div className="req-form-group">
              <label htmlFor="req-notes">
                <MessageSquare size={14} />
                <span>ملاحظات إضافية (اختياري)</span>
              </label>
              <textarea
                id="req-notes"
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: نريده بترجمة عربية معينة أو جودة 4K..."
              />
            </div>

            <div className="req-form-footer">
              <div className="req-tg-hint">
                <Sparkles size={14} style={{ color: '#facc15' }} />
                <span>يتم نشر الأفلام المطلوبة يومياً على قناة التليجرام <strong>@movora_me</strong></span>
              </div>
              <div className="req-buttons">
                <button 
                  type="button" 
                  className="req-btn-cancel" 
                  onClick={onClose}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="req-btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spin-icon" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>إرسال طلب الفيلم 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
