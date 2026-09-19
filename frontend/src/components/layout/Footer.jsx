import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Send } from 'lucide-react';
import Logo from '../shared/Logo';
import '../../styles/Footer.css';

export default function Footer() {
  return (
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

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Movora (movora.me) - جميع الحقوق محفوظة.</span>
          <Link to="/admin" className="footer-admin-link" title="بوابة الإدارة والترافيك">
            <Lock size={12} /> لوحة الإدارة
          </Link>
        </div>
      </div>
    </footer>
  );
}
