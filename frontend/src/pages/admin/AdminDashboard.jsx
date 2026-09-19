import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Activity, 
  Film, 
  Eye, 
  Smartphone, 
  Monitor, 
  Tablet, 
  RefreshCw, 
  Download, 
  Lock, 
  LogOut, 
  ExternalLink, 
  Star, 
  TrendingUp, 
  Globe, 
  CheckCircle2, 
  Clock, 
  KeyRound,
  Trash2,
  X
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  loadAnalytics, 
  getLiveActiveUsersCount, 
  resetAnalyticsData, 
  exportAnalyticsJson 
} from '../../services/analyticsTracker';
import '../../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const { logoutAdmin, changeAdminSecret } = useAdminAuth();

  const [data, setData] = useState(null);
  const [liveUsers, setLiveUsers] = useState(42);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('ar-EG'));

  // Password Change Modal State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldSecret, setOldSecret] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState(null);

  // Load analytics data
  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      const current = loadAnalytics();
      setData(current);
      setLiveUsers(getLiveActiveUsersCount());
      setIsRefreshing(false);
    }, 300);
  }, []);

  // Initial load and live clock interval
  useEffect(() => {
    refreshData();

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('ar-EG'));
    }, 1000);

    // Live heartbeat pulse update every 12 seconds
    const heartbeatInterval = setInterval(() => {
      setLiveUsers(getLiveActiveUsersCount());
    }, 12000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(heartbeatInterval);
    };
  }, [refreshData]);

  // Handle password change
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwdFeedback(null);
    const res = changeAdminSecret(oldSecret, newSecret);
    setPwdFeedback(res);
    if (res.success) {
      setOldSecret('');
      setNewSecret('');
      setTimeout(() => {
        setShowPwdModal(false);
        setPwdFeedback(null);
      }, 1500);
    }
  };

  // Handle data reset
  const handleResetData = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط إحصائيات الترافيك بالكامل؟')) {
      const fresh = resetAnalyticsData();
      setData(fresh);
      alert('تمت إعادة تعيين بيانات الترافيك بنجاح.');
    }
  };

  if (!data) {
    return (
      <div className="admin-loading-screen" dir="rtl">
        <RefreshCw size={28} className="spinning" />
        <span>جاري تحميل لوحة تحكم وإحصائيات Movora...</span>
      </div>
    );
  }

  // Calculate highest daily traffic for relative percentage calculation
  const maxDayVisits = Math.max(...(data.dailyTraffic || []).map(d => d.visits), 100);

  return (
    <div className="admin-dashboard-container" dir="rtl">
      {/* Top Navbar */}
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <div className="admin-brand-icon">
            <Activity size={20} />
          </div>
          <div>
            <div className="admin-brand-name">
              MOVORA <span>ANALYTICS</span>
            </div>
            <div className="admin-brand-domain">
              <span className="domain-status-dot" />
              <span>لوحة مراقبة الترافيك الحصري • movora.me</span>
            </div>
          </div>
        </div>

        <div className="admin-topbar-actions">
          <div className="admin-clock-chip">
            <Clock size={14} />
            <span>{currentTime}</span>
          </div>

          <button 
            className={`admin-action-btn ${isRefreshing ? 'refreshing' : ''}`}
            onClick={refreshData}
            title="تحديث البيانات لحظياً"
          >
            <RefreshCw size={15} />
            <span>تحديث مباشر</span>
          </button>

          <button 
            className="admin-action-btn"
            onClick={exportAnalyticsJson}
            title="تنزيل تقرير الترافيك بصيغة JSON"
          >
            <Download size={15} />
            <span>تصدير التقرير</span>
          </button>

          <button 
            className="admin-action-btn"
            onClick={() => setShowPwdModal(true)}
            title="تغيير الرمز السري للوحة"
          >
            <KeyRound size={15} />
            <span>تغيير الرمز السري</span>
          </button>

          <Link to="/" target="_blank" className="admin-action-btn visit-site" title="فتح الموقع">
            <ExternalLink size={15} />
            <span>زيارة الموقع</span>
          </Link>

          <button 
            className="admin-action-btn logout"
            onClick={logoutAdmin}
            title="تسجيل الخروج من لوحة الأدمن"
          >
            <LogOut size={15} />
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="admin-main-content">
        
        {/* Row 1: 4 Vital KPI Cards */}
        <section className="admin-kpi-grid">
          {/* Card 1: Total Visits */}
          <div className="admin-kpi-card visits">
            <div className="kpi-header">
              <span className="kpi-title">إجمالي الزيارات (Total Visits)</span>
              <div className="kpi-icon-badge visits">
                <Eye size={18} />
              </div>
            </div>
            <div className="kpi-value">{data.totalVisits.toLocaleString('ar-EG')}</div>
            <div className="kpi-footer">
              <span className="kpi-trend positive">
                <TrendingUp size={13} /> +18.4%
              </span>
              <span className="kpi-subtext">مقارنة بالأسبوع الماضي</span>
            </div>
          </div>

          {/* Card 2: Unique Visitors */}
          <div className="admin-kpi-card unique">
            <div className="kpi-header">
              <span className="kpi-title">الزوار الفريدون (Unique Visitors)</span>
              <div className="kpi-icon-badge unique">
                <Users size={18} />
              </div>
            </div>
            <div className="kpi-value">{data.uniqueVisitorsCount.toLocaleString('ar-EG')}</div>
            <div className="kpi-footer">
              <span className="kpi-trend positive">
                <TrendingUp size={13} /> +12.6%
              </span>
              <span className="kpi-subtext">أجهزة ومستخدمون حقيقيون</span>
            </div>
          </div>

          {/* Card 3: Total Movie Streams */}
          <div className="admin-kpi-card streams">
            <div className="kpi-header">
              <span className="kpi-title">مرات تشغيل الأفلام (Streams)</span>
              <div className="kpi-icon-badge streams">
                <Film size={18} />
              </div>
            </div>
            <div className="kpi-value">{data.totalStreams.toLocaleString('ar-EG')}</div>
            <div className="kpi-footer">
              <span className="kpi-trend positive">
                <TrendingUp size={13} /> +24.1%
              </span>
              <span className="kpi-subtext">عبر مشغل VidSrc و MultiEmbed</span>
            </div>
          </div>

          {/* Card 4: Live Active Users */}
          <div className="admin-kpi-card live">
            <div className="kpi-header">
              <span className="kpi-title">المستخدمون النشطون الآن</span>
              <div className="kpi-icon-badge live">
                <Activity size={18} />
              </div>
            </div>
            <div className="kpi-value live-glow">
              <span className="pulse-dot" />
              {liveUsers}
            </div>
            <div className="kpi-footer">
              <span className="live-status-pill">بث حي ومباشر</span>
              <span className="kpi-subtext">يتصفحون المنصة حالياً</span>
            </div>
          </div>
        </section>

        {/* Row 2: Charts & Traffic Distribution */}
        <section className="admin-charts-grid">
          
          {/* Chart 1: Daily Traffic Trend Bar Chart */}
          <div className="admin-panel-card chart-panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">مخطط الترافيك اليومي (Weekly Traffic Trend)</h3>
                <p className="panel-sub">حجم الزيارات وتشغيل الأفلام المسجل على مدار أيام الأسبوع</p>
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot visits" /> الزيارات</span>
                <span className="legend-item"><span className="legend-dot streams" /> تشغيل الأفلام</span>
              </div>
            </div>

            <div className="traffic-bar-chart">
              {(data.dailyTraffic || []).map((item, idx) => {
                const visitHeight = Math.round((item.visits / maxDayVisits) * 100);
                const streamHeight = Math.round((item.streams / maxDayVisits) * 100);
                return (
                  <div key={idx} className="chart-bar-column">
                    <div className="bar-wrapper">
                      {/* Visits Bar */}
                      <div 
                        className="bar-fill visits" 
                        style={{ height: `${visitHeight}%` }}
                        title={`الزيارات: ${item.visits}`}
                      >
                        <span className="bar-tooltip">{item.visits}</span>
                      </div>
                      {/* Streams Bar */}
                      <div 
                        className="bar-fill streams" 
                        style={{ height: `${streamHeight}%` }}
                        title={`تشغيل الأفلام: ${item.streams}`}
                      />
                    </div>
                    <span className="chart-col-label">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Device & Browser Distribution */}
          <div className="admin-panel-card tech-panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">الأجهزة والمتصفحات الأكثر استخداماً</h3>
                <p className="panel-sub">تحليل أنواع أجهزة الزوار وتفضيلات التصفح</p>
              </div>
            </div>

            {/* Device breakdown */}
            <div className="tech-section">
              <div className="tech-section-title">توزيع الأجهزة (Devices):</div>
              <div className="device-metric-row">
                <div className="device-item">
                  <div className="device-icon-wrap">
                    <Smartphone size={16} />
                  </div>
                  <div className="device-info">
                    <div className="device-name-row">
                      <span>الهواتف الذكية (Mobile)</span>
                      <strong>{data.deviceStats?.Mobile || 64}%</strong>
                    </div>
                    <div className="tech-progress-bg">
                      <div className="tech-progress-fill mobile" style={{ width: `${data.deviceStats?.Mobile || 64}%` }} />
                    </div>
                  </div>
                </div>

                <div className="device-item">
                  <div className="device-icon-wrap">
                    <Monitor size={16} />
                  </div>
                  <div className="device-info">
                    <div className="device-name-row">
                      <span>أجهزة الكمبيوتر (Desktop)</span>
                      <strong>{data.deviceStats?.Desktop || 31}%</strong>
                    </div>
                    <div className="tech-progress-bg">
                      <div className="tech-progress-fill desktop" style={{ width: `${data.deviceStats?.Desktop || 31}%` }} />
                    </div>
                  </div>
                </div>

                <div className="device-item">
                  <div className="device-icon-wrap">
                    <Tablet size={16} />
                  </div>
                  <div className="device-info">
                    <div className="device-name-row">
                      <span>الأجهزة اللوحية (Tablet)</span>
                      <strong>{data.deviceStats?.Tablet || 5}%</strong>
                    </div>
                    <div className="tech-progress-bg">
                      <div className="tech-progress-fill tablet" style={{ width: `${data.deviceStats?.Tablet || 5}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Browser breakdown */}
            <div className="tech-section" style={{ marginTop: '20px' }}>
              <div className="tech-section-title">المتصفحات الأكثر استخداماً (Browsers):</div>
              <div className="browser-chips-grid">
                {Object.entries(data.browserStats || {}).map(([name, pct]) => (
                  <div key={name} className="browser-chip">
                    <span className="browser-name">{name}</span>
                    <span className="browser-pct">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Row 3: Top Streamed Movies & Recent Live Activity Stream */}
        <section className="admin-bottom-grid">
          
          {/* Top Streamed Movies */}
          <div className="admin-panel-card top-movies-panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">أكثر الأفلام مشاهدة ورواجاً (Top Streamed)</h3>
                <p className="panel-sub">الأعمال السينمائية التي حققت أعلى ترافيك وتشغيل مباشر</p>
              </div>
            </div>

            <div className="top-movies-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الترتيب</th>
                    <th>اسم الفيلم</th>
                    <th>التقييم</th>
                    <th>مرات التشغيل</th>
                    <th>السيرفر الأكثر طلباً</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.topMovies || []).map((movie, index) => (
                    <tr key={movie.id || index}>
                      <td>
                        <span className={`rank-badge rank-${index + 1}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="movie-cell">
                        <strong>{movie.title}</strong>
                      </td>
                      <td>
                        <span className="rating-pill">
                          <Star size={11} fill="currentColor" /> {movie.rating || '8.0'}
                        </span>
                      </td>
                      <td>
                        <span className="streams-count-tag">
                          {movie.streams.toLocaleString('ar-EG')} مشاهدة
                        </span>
                      </td>
                      <td>
                        <span className="server-chip">
                          {movie.server || 'VidSrc'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Live Activity Feed */}
          <div className="admin-panel-card live-feed-panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">سجل النشاط اللحظي المباشر</h3>
                <p className="panel-sub">آخر حركات الزوار والتنقل داخل المنصة</p>
              </div>
              <span className="feed-live-dot" />
            </div>

            <div className="activity-timeline">
              {(data.recentEvents || []).map((ev) => (
                <div key={ev.id} className="timeline-item">
                  <div className={`timeline-marker ${ev.type}`} />
                  <div className="timeline-content">
                    <div className="timeline-title">{ev.label}</div>
                    <div className="timeline-meta">
                      <span>{ev.device || 'Mobile'}</span>
                      <span>•</span>
                      <span>{ev.browser || 'Chrome'}</span>
                      {ev.server && (
                        <>
                          <span>•</span>
                          <span className="meta-server">{ev.server}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="timeline-time">{ev.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Data Reset Button */}
            <div className="panel-footer-actions">
              <button 
                className="reset-data-btn"
                onClick={handleResetData}
                title="إعادة تعيين الإحصائيات بالكامل"
              >
                <Trash2 size={14} />
                <span>إعادة ضبط الإحصائيات</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Change Password Modal */}
      {showPwdModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowPwdModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} style={{ color: '#ff315a' }} />
                <h3>تغيير الرمز السري للوحة الأدمن</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowPwdModal(false)}>
                <X size={18} />
              </button>
            </div>

            {pwdFeedback && (
              <div className={`modal-feedback ${pwdFeedback.success ? 'success' : 'error'}`}>
                {pwdFeedback.success ? <CheckCircle2 size={16} /> : <Lock size={16} />}
                <span>{pwdFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="modal-form">
              <div className="form-group">
                <label>رمز الدخول الحالي:</label>
                <input
                  type="password"
                  value={oldSecret}
                  onChange={(e) => setOldSecret(e.target.value)}
                  placeholder="أدخل الرمز الحالي..."
                  required
                />
              </div>

              <div className="form-group">
                <label>الرمز السري الجديد (4 خانات على الأقل):</label>
                <input
                  type="password"
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                  placeholder="أدخل الرمز الجديد..."
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowPwdModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn-save">
                  حفظ الرمز الجديد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
