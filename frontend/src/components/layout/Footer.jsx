import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import '../../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="footer" dir="rtl">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="footer-logo">MOVORA<span>.</span></span>
          <span className="footer-domain">movora.me</span>
        </div>
        <p className="footer-desc">
          منصة ترفيهية متكاملة تقدم أحدث وأقوى الأعمال السينمائية العالمية بدقة فائقة وترجمة احترافية حصرية.
        </p>
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
