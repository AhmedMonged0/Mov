import React from 'react';
import { Link } from 'react-router-dom';
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
