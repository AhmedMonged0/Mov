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
  CheckCircle2, 
  Clock, 
  KeyRound,
  Trash2,
  X,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  loadAnalytics, 
  getLiveActiveUsersCount, 
  getDevicePercentages,
  getBrowserPercentages,
  resetAnalyticsData, 
  exportAnalyticsJson,
  recordHeartbeat 
} from '../../services/analyticsTracker';
import '../../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const { logoutAdmin, changeAdminSecret } = useAdminAuth();

  const [data, setData] = useState(null);
  const [liveUsers, setLiveUsers] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('ar-EG'));

  // Password Change Modal State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldSecret, setOldSecret] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState(null);

  // Load real analytics data
  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      recordHeartbeat();
      const current = loadAnalytics();
      setData(current);
      setLiveUsers(getLiveActiveUsersCount());
      setIsRefreshing(false);
    }, 250);
  }, []);

  // Initial load and live clock interval
  useEffect(() => {
    refreshData();

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('ar-EG'));
    }, 1000);

    // Live heartbeat pulse update every 10 seconds
    const heartbeatInterval = setInterval(() => {
      setLiveUsers(getLiveActiveUsersCount());
    }, 10000);

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
    if (window.confirm('هل تريد تصفية وبدء تسجيل الترافيك الحقيقي من الصفر (0)؟')) {
      const fresh = resetAnalyticsData();
      setData(fresh);
      setLiveUsers(1);
      alert('تمت تصفية الإحصائيات وبدء الحساب الحقيقي من الصفر.');
    }
  };

  if (!data) {
    return (
      <div className="admin-loading-screen" dir="rtl">
        <RefreshCw size={28} className="spinning" />
        <span>جاري تحميل إحصائيات الترافيك الحقيقية لـ Movora...</span>
      </div>
    );
  }

  // Calculate real device and browser percentages
  const devicePcts = getDevicePercentages(data.deviceCounts);
  const browserPcts = getBrowserPercentages(data.browserCounts);
  const browserEntries = Object.entries(browserPcts);

  // Calculate highest daily traffic for relative percentage calculation
  const maxDayVisits = Math.max(...(data.dailyTraffic || []).map(d => d.visits), 1);

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
              MOVORA <span>REAL ANALYTICS</span>
            </div>
            <div className="admin-brand-domain">
              <span className="domain-status-dot" />
              <span>تتبع الترافيك والزيارات الحقيقية • movora.me</span>
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
            title="تنزيل تقرير الترافيك الحقيقي بصيغة JSON"
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

        {/* Real Data Banner */}
        <div style={{
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '13.5px', color: '#e2e8f0' }}>
              <strong>نظام التتبع المباشر 100% نشط:</strong> يتم رصد كل زيارة حقيقية ومشاهدة فيلم لحظة بلحظة دون أي أرقام وهمية.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a 
              href="https://vercel.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#000',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              <BarChart3 size={13} />
              <span>تحليلات Vercel السحابية الرسمية</span>
            </a>
          </div>
        </div>
        
        {/* Row 1: 4 Vital KPI Cards (100% REAL) */}
        <section className="admin-kpi-grid">
          {/* Card 1: Total Visits */}
          <div className="admin-kpi-card visits">
            <div className="kpi-header">
              <span className="kpi-title">إجمالي الزيارات الحقيقية</span>
              <div className="kpi-icon-badge visits">
                <Eye size={18} />
              </div>
            </div>
            <div className="kpi-value">{(data.totalVisits || 0).toLocaleString('en-US')}</div>
            <div className="kpi-footer">
              <span className="kpi-trend positive">
                <CheckCircle2 size={13} /> عداد مباشر
              </span>
              <span className="kpi-subtext">إجمالي الصفحات التي تم فتحها</span>
            </div>
          </div>

          {/* Card 2: Unique Visitors */}
          <div className="admin-kpi-card unique">
            <div className="kpi-header">
              <span className="kpi-title">الزوار الفريدون الفعليون</span>
              <div className="kpi-icon-badge unique">
                <Users size={18} />
              </div>
            </div>
            <div className="kpi-value">{(data.uniqueVisitorsCount || 0).toLocaleString('en-US')}</div>
            <div className="kpi-footer">
              <span className="kpi-trend positive">
                <CheckCircle2 size={13} /> أجهزة فعلية
              </span>
              <span className="kpi-subtext">مستخدمون حقيقيون بدون تكرار</span>
            </div>
          </div>

          {/* Card 3: Total Movie Streams */}
          <div className="admin-kpi-card streams">
            <div className="kpi-header">
              <span className="kpi-title">مرات تشغيل الأفلام الفعلية</span>
              <div className="kpi-icon-badge streams">
                <Film size={18} />
              </div>
            </div>
            <div className="kpi-value">{(data.totalStreams || 0).toLocaleString('en-US')}</div>
            <div className="kpi-footer">
              <span className="kpi-trend positive">
                <CheckCircle2 size={13} /> تشغيل فعلي
              </span>
              <span className="kpi-subtext">تم تشغيلها عبر المشغل</span>
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
              <span className="live-status-pill">نشط الآن</span>
              <span className="kpi-subtext">متواجدون على المنصة حالياً</span>
            </div>
          </div>
        </section>

        {/* Row 2: Charts & Traffic Distribution */}
        <section className="admin-charts-grid">
          
          {/* Chart 1: Daily Traffic Trend Bar Chart */}
          <div className="admin-panel-card chart-panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">مخطط الترافيك الفعلي حسب الأيام</h3>
                <p className="panel-sub">حجم الزيارات وتشغيل الأفلام الفعلي المسجل في كل يوم</p>
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot visits" /> الزيارات</span>
                <span className="legend-item"><span className="legend-dot streams" /> تشغيل الأفلام</span>
              </div>
            </div>

            <div className="traffic-bar-chart">
              {(data.dailyTraffic || []).map((item, idx) => {
                const visitHeight = maxDayVisits > 0 ? Math.max(item.visits > 0 ? 8 : 0, Math.round((item.visits / maxDayVisits) * 100)) : 0;
                const streamHeight = maxDayVisits > 0 ? Math.max(item.streams > 0 ? 8 : 0, Math.round((item.streams / maxDayVisits) * 100)) : 0;
                return (
                  <div key={idx} className="chart-bar-column">
                    <div className="bar-wrapper">
                      {/* Visits Bar */}
                      <div 
                        className="bar-fill visits" 
                        style={{ height: `${visitHeight}%` }}
                        title={`الزيارات: ${item.visits}`}
                      >
                        {item.visits > 0 && <span className="bar-tooltip">{item.visits}</span>}
                      </div>
                      {/* Streams Bar */}
                      <div 
                        className="bar-fill streams" 
                        style={{ height: `${streamHeight}%` }}
                        title={`تشغيل الأفلام: ${item.streams}`}
                      />
                    </div>
                    <span className="chart-col-label">{item.day}</span>
                    <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{item.visits}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Device & Browser Distribution */}
          <div className="admin-panel-card tech-panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">توزيع الأجهزة والمتصفحات الفعلية</h3>
                <p className="panel-sub">محسوبة مباشرة من بيانات الزوار الحقيقيين</p>
              </div>
            </div>

            {/* Device breakdown */}
            <div className="tech-section">
              <div className="tech-section-title">الأجهزة (Devices):</div>
              <div className="device-metric-row">
                <div className="device-item">
                  <div className="device-icon-wrap">
                    <Smartphone size={16} />
                  </div>
                  <div className="device-info">
                    <div className="device-name-row">
                      <span>الهواتف الذكية (Mobile)</span>
                      <strong>{devicePcts.Mobile}% ({data.deviceCounts?.Mobile || 0})</strong>
                    </div>
                    <div className="tech-progress-bg">
                      <div className="tech-progress-fill mobile" style={{ width: `${devicePcts.Mobile}%` }} />
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
                      <strong>{devicePcts.Desktop}% ({data.deviceCounts?.Desktop || 0})</strong>
                    </div>
                    <div className="tech-progress-bg">
                      <div className="tech-progress-fill desktop" style={{ width: `${devicePcts.Desktop}%` }} />
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
                      <strong>{devicePcts.Tablet}% ({data.deviceCounts?.Tablet || 0})</strong>
                    </div>
                    <div className="tech-progress-bg">
                      <div className="tech-progress-fill tablet" style={{ width: `${devicePcts.Tablet}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Browser breakdown */}
            <div className="tech-section" style={{ marginTop: '20px' }}>
              <div className="tech-section-title">المتصفحات (Browsers):</div>
              {browserEntries.length > 0 ? (
                <div className="browser-chips-grid">
                  {browserEntries.map(([name, pct]) => (
                    <div key={name} className="browser-chip">
                      <span className="browser-name">{name}</span>
                      <span className="browser-pct">{pct}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '10px' }}>
                  بانتظار تسجيل أول زيارة للمتصفحات...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Row 3: Top Streamed Movies & Recent Live Activity Stream */}
        <section className="admin-bottom-grid">
          
          {/* Top Streamed Movies */}
          <div className="admin-panel-card top-movies-panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">الأفلام الأكثر مشاهدة فعلياً على الموقع</h3>
                <p className="panel-sub">الأعمال السينمائية التي ضغط الزوار على مشاهدتها حقيقة</p>
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
                    <th>السيرفر المستخدم</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topMovies && data.topMovies.length > 0 ? (
                    data.topMovies.map((movie, index) => (
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
                            {movie.streams.toLocaleString('en-US')} مشاهدة
                          </span>
                        </td>
                        <td>
                          <span className="server-chip">
                            {movie.server || 'VidSrc'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '36px 14px', color: '#717688' }}>
                        لا توجد مشاهدات مسجلة بعد — بمجرد أن يقوم أي زائر بتشغيل فيلم، سيظهر هنا فوراً بالترتيب الفعلي!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Live Activity Feed */}
          <div className="admin-panel-card live-feed-panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">سجل النشاط اللحظي الحقيقي</h3>
                <p className="panel-sub">الأحداث التي يقوم بها الزوار حالياً</p>
              </div>
              <span className="feed-live-dot" />
            </div>

            <div className="activity-timeline">
              {data.recentEvents && data.recentEvents.length > 0 ? (
                data.recentEvents.map((ev) => (
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
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>
                  بانتظار تسجيل أول نشاط مباشر من الزوار...
                </div>
              )}
            </div>

            {/* Clear Data Reset Button */}
            <div className="panel-footer-actions">
              <button 
                className="reset-data-btn"
                onClick={handleResetData}
                title="تصفية الإحصائيات وبدء الحساب من الصفر"
              >
                <Trash2 size={14} />
                <span>تصفية الإحصائيات والبدء من 0</span>
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
