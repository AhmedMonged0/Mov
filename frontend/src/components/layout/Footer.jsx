import React from 'react';
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
          منصة ترفيهية متكاملة تقدم أحدث وأقوى الأفلام والمسلسلات بالاعتماد على قاعدة بيانات TMDB الرسمية.
        </p>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Movora (movora.me) - جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
