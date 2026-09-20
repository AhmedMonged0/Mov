import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Scale, AlertTriangle, Info } from 'lucide-react';
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
            <h2 id="dmca-modal-title">إخلاء المسؤولية القانونية</h2>
            <span className="dmca-subtitle">Legal Disclaimer & Content Notice</span>
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
              <h3>1. طبيعة المنصة وعدم الاستضافة (Non-Hosting Platform)</h3>
            </div>
            <p>
              موفورا هو محرك فهرسة وواجهة تصفح لتنظيم العروض، ولا يحتوي سيرفر الموقع على بايت واحد من ملفات الفيديو. الموقع لا يستضيف، لا يرفع، ولا يقوم بإعادة بث أي مادة فلمية أو مسلسل من خوادمه المحلية.
            </p>
          </div>

          {/* Section 2: Third-Party Embeds */}
          <div className="dmca-section">
            <div className="dmca-section-title">
              <Info size={18} />
              <h3>2. التضمين والمشغلات الخارجية (Third-Party Embeds)</h3>
            </div>
            <p>
              كافة المشغلات والروابط المعروضة تعمل بتقنية التضمين <code>(Embed Iframes)</code> من مزودين وسيرفرات استضافة خارجية متاحة علناً على شبكة الإنترنت وتتبع أطرافاً ثالثة مستقلة لا ترتبط بإدارة موفورا بأي شكل من الأشكال.
            </p>
          </div>

          {/* Section 3: Intellectual Property & Trademarks */}
          <div className="dmca-section">
            <div className="dmca-section-title">
              <ShieldCheck size={18} />
              <h3>3. حقوق الملكية الفكرية والعلامات التجارية</h3>
            </div>
            <p>
              جميع الصور، البوسترات، العناوين، والعلامات التجارية المعروضة في الموقع هي ملك حصري لأصحابها وشركات الإنتاج والتوزيع الأصلية، واستخدامها في الموقع هو لأغراض الفهرسة والتعريف الفني والإعلامي فقط.
            </p>
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
