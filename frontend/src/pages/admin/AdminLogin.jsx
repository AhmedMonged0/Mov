import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Key, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import '../../styles/AdminDashboard.css';

export default function AdminLogin() {
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!secret.trim()) {
      setError('يرجى إدخال الرمز السري للوحة التحكم');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = loginAdmin(secret);
      setLoading(false);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'رمز الدخول غير صالح');
      }
    }, 350);
  };

  return (
    <div className="admin-login-page" dir="rtl">
      {/* Ambient background glow */}
      <div className="admin-login-glow" />

      <div className="admin-login-card">
        {/* Brand & Security Header */}
        <div className="admin-login-header">
          <div className="admin-icon-ring">
            <ShieldCheck size={32} className="admin-shield-icon" />
          </div>
          <div className="admin-brand-tag">MOVORA ADMIN PORTAL</div>
          <h1 className="admin-login-title">لوحة التحكم والترافيك</h1>
          <p className="admin-login-sub">
            منطقة إدارية خاصة ومحمية لمراقبة نشاط الزوار وترافيك منصة movora.me
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="admin-error-box">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-input-group">
            <label htmlFor="adminSecret">رمز الدخول أو الـ PIN السري:</label>
            <div className="admin-input-wrapper">
              <Key size={18} className="admin-input-icon" />
              <input
                id="adminSecret"
                type={showSecret ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="أدخل الرمز السري..."
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                className="admin-pw-toggle"
                onClick={() => setShowSecret(!showSecret)}
                tabIndex={-1}
              >
                {showSecret ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <span className="admin-input-hint">
              الرمز الافتراضي: <code>202688</code> أو <code>movora@admin2026</code> (يمكن تغييره لاحقاً)
            </span>
          </div>

          <button 
            type="submit" 
            className="admin-login-btn"
            disabled={loading}
          >
            <Lock size={17} />
            <span>{loading ? 'جاري التحقق من الصلاحيات...' : 'دخول لوحة التحكم'}</span>
          </button>
        </form>

        {/* Footer Link */}
        <div className="admin-login-footer">
          <Link to="/" className="admin-back-link">
            <ArrowRight size={16} /> العودة لموقع Movora
          </Link>
        </div>
      </div>
    </div>
  );
}
