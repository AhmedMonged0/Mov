import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Scale, AlertTriangle, ExternalLink, Send, Mail, CheckCircle2 } from 'lucide-react';
import '../../styles/DmcaModal.css';

export default function DmcaModal({ isOpen, onClose }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev || 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="dmca-modal-overlay" onClick={onClose} dir="rtl">
      <div 
        className="dmca-modal-card" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="dmca-modal-title"
      >
        {/* Modal Header */}
        <div className="dmca-modal-header">
          <div className="dmca-header-icon-wrap">
            <ShieldCheck size={26} className="dmca-header-icon" />
          </div>
          <div className="dmca-header-titles">
            <h2 id="dmca-modal-title">إخلاء المسؤولية وحقوق الملكية الفكرية</h2>
            <span className="dmca-subtitle">DMCA & Copyright Compliance Policy</span>
          </div>
          <button 
            type="button" 
            className="dmca-close-btn" 
            onClick={onClose} 
            title="إغلاق النافذة"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="dmca-modal-body">
          {/* Important Highlight Notice */}
          <div className="dmca-alert-banner">
            <AlertTriangle size={20} className="dmca-alert-icon" />
            <div className="dmca-alert-text">
              <strong>تنويه هام:</strong> منصة موفورا (movora.me) محرك بحث وفهرسة سحابي ترفيهي ولا تقوم باستضافة أو تخزين أو رفع أي ملفات وسائط أو فيديوهات على خوادمها الخاصة إطلاقاً.
            </div>
          </div>

          {/* Section 1: Nature of Service */}
          <div className="dmca-section">
            <div className="dmca-section-title">
              <Scale size={18} />
              <h3>1. طبيعة المنصة وعمل المشغلات (Non-Hosting Platform)</h3>
            </div>
            <p>
              جميع الروابط والمشغلات المعروضة في موفورا هي روابط تضمين خارجية <code>(Embed Iframes)</code> مستدعاة من مزودي طرف ثالث خارجيين وشبكات استضافة عامة على شبكة الإنترنت 
              (مثل VidSrc, SuperEmbed ومصادر عامة مماثلة). هذه الخوادم مستقلة تماماً ولا تخضع لأي إدارة أو تحكم من قبل إدارة موفورا.
            </p>
          </div>

          {/* Section 2: Respect for Intellectual Property */}
          <div className="dmca-section">
            <div className="dmca-section-title">
              <ShieldCheck size={18} />
              <h3>2. الامتثال لقانون الألفية لحقوق النشر الرقمية (DMCA Compliance)</h3>
            </div>
            <p>
              نحن نحترم حقوق الملكية الفكرية لكافة الشركات والمنتجين وأصحاب الحقوق في جميع أنحاء العالم. ونلتزم بالاستجابة السريعة لأي إخطار رسمي بانتهاك حقوق الطبع والنشر بموجب أحكام قانون حقوق النشر الرقمية (DMCA).
            </p>
          </div>

          {/* Section 3: Takedown Instructions */}
          <div className="dmca-section">
            <div className="dmca-section-title">
              <CheckCircle2 size={18} />
              <h3>3. متطلبات تقديم طلب إزالة المحتوى (Takedown Notice)</h3>
            </div>
            <p>إذا كنت المالك القانوني لحقوق عمل معين أو وكيلاً رسمياً مفوضاً، وترغب في إزالة صفحة الفيلم أو المسلسل من الفهرس، يُرجى تزويدنا بالتالي:</p>
            <ul className="dmca-list">
              <li>إثبات رسمي واضح لملكية العمل أو توكيل قانوني معتمد من جهة الإنتاج.</li>
              <li>رابط العمل الرسمي الأصلي لإثبات الملكية.</li>
              <li>رابط أو روابط الصفحات المحددة على موقع موفورا المطلوب حذفها.</li>
              <li>وسيلة اتصال رسمية للتحقق من هوية مقدم الطلب.</li>
            </ul>
          </div>

          {/* Contact Box */}
          <div className="dmca-contact-card">
            <h4>قنوات التواصل الرسمية لطلبات الإزالة والمصنفات:</h4>
            <div className="dmca-contact-actions">
              <a 
                href="https://t.me/movora_me" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="dmca-btn-tg"
              >
                <Send size={16} />
                <span>التواصل المباشر عبر تليجرام (@movora_me)</span>
              </a>
              <a 
                href="mailto:dmca@movora.me?subject=DMCA%20Takedown%20Request%20-%20Movora" 
                className="dmca-btn-mail"
              >
                <Mail size={16} />
                <span>إرسال بريد إلكتروني (dmca@movora.me)</span>
              </a>
            </div>
            <span className="dmca-sla-badge">⚡ نلتزم بمراجعة الطلبات وحذف الروابط المخالفة خلال أقل من 24-48 ساعة عمل.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="dmca-modal-footer">
          <button type="button" className="dmca-btn-dismiss" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
