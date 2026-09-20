import React, { useState } from 'react';
import { Send, ShieldCheck } from 'lucide-react';
import Logo from '../shared/Logo';
import DmcaModal from '../shared/DmcaModal';
import '../../styles/Footer.css';

export default function Footer() {
  const [showDmcaModal, setShowDmcaModal] = useState(false);

  return (
    <>
      <footer className="footer" dir="rtl">
        <div className="footer-content">
          <div className="footer-brand">
            <Logo size="small" showDomain={true} />
          </div>
          <p className="footer-desc">
            منصة ترفيهية متكاملة تقدم أحدث وأقوى الأعمال السينمائية العالمية بدقة فائقة وترجمة احترافية حصرية.
          </p>

          {/* Telegram Community Card */}
          <a 
            href="https://t.me/movora_me" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="footer-tg-card"
            title="انضم لقناة موفورا الرسمية على تليجرام"
          >
            <div className="footer-tg-icon">
              <Send size={18} />
            </div>
            <div className="footer-tg-info">
              <span className="footer-tg-label">انضم لقناتنا الرسمية على تليجرام</span>
              <span className="footer-tg-user">@movora_me</span>
            </div>
            <span className="footer-tg-cta">انضم الآن 🚀</span>
          </a>

          {/* Legal DMCA Disclaimer Box */}
          <div className="footer-disclaimer-box">
            <p className="footer-disclaimer-text">
              <strong>إخلاء مسؤولية (DMCA):</strong> منصة موفورا (movora.me) محرك بحث وفهرسة للمحتوى السحابي ولا تقوم برفع أو تخزين أي ملفات فيديو على خوادمها إطلاقاً. كافة المحتويات والمشغلات مستدعاة عبر تقنية التضمين (Embed) من أطراف ثالثة ومصادر متاحة علناً.
            </p>
            <button 
              type="button" 
              className="footer-dmca-btn"
              onClick={() => setShowDmcaModal(true)}
              title="عرض سياسة حقوق الملكية الفكرية وطلبات الإزالة"
            >
              <ShieldCheck size={14} />
              <span>سياسة حقوق الملكية وطلبات الإزالة (DMCA Policy)</span>
            </button>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Movora (movora.me) - جميع الحقوق محفوظة.</span>
          </div>
        </div>
      </footer>

      {/* DMCA Copyright Policy Modal */}
      <DmcaModal 
        isOpen={showDmcaModal} 
        onClose={() => setShowDmcaModal(false)} 
      />
    </>
  );
}
