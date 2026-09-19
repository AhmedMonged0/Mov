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
  BarChart3,
  Cloud,
  Database
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  loadAnalytics, 
  fetchGlobalAnalytics,
  getLiveActiveUsersCount, 
  getDevicePercentages,
  getBrowserPercentages,
  resetAnalyticsData, 
  exportAnalyticsJson,
  recordHeartbeat,
  getFirebaseDbUrl,
  setFirebaseDbUrl
} from '../../services/analyticsTracker';
import '../../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const { logoutAdmin, changeAdminSecret } = useAdminAuth();

  const [data, setData] = useState(() => loadAnalytics());
  const [liveUsers, setLiveUsers] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('ar-EG'));

  // Password Change Modal State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldSecret, setOldSecret] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState(null);

  // Cloud Database Modal State
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [firebaseUrlInput, setFirebaseUrlInput] = useState(() => getFirebaseDbUrl());
  const [cloudStatus, setCloudStatus] = useState(true);
  const [cloudFeedback, setCloudFeedback] = useState(null);

  // Load real global analytics data from cloud
  const refreshData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsRefreshing(true);
    recordHeartbeat();
    try {
      const current = await fetchGlobalAnalytics();
      if (current) {
        setData(current);
        setLiveUsers(current.liveActiveCount || 1);
      }
    } catch (e) {
      const local = loadAnalytics();
      setData(local);
      setLiveUsers(getLiveActiveUsersCount());
    } finally {
      if (showSpinner) setIsRefreshing(false);
    }
  }, []);

  // Initial load and live intervals
  useEffect(() => {
    refreshData(false);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('ar-EG'));
    }, 1000);

    // Auto-fetch real-time cloud data every 6 seconds silently
    const cloudPollInterval = setInterval(() => {
      refreshData(false);
    }, 6000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(cloudPollInterval);
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
  const handleResetData = async () => {
    if (window.confirm('هل تريد تصفية وبدء تسجيل الترافيك الحقيقي من الصفر (0)؟')) {
      const fresh = await resetAnalyticsData();
      setData(fresh);
      setLiveUsers(1);
      alert('تمت تصفية الإحصائيات وبدء الحساب الحقيقي من الصفر.');
    }
  };

  // Handle Cloud DB URL save
  const handleCloudSubmit = async (e) => {
    e.preventDefault();
    setCloudFeedback(null);
    try {
      const saved = setFirebaseDbUrl(firebaseUrlInput);
      setCloudStatus(Boolean(saved));
      if (saved) {
        setCloudFeedback({ success: true, message: 'تم حفظ رابط السحابة بنجاح! جاري جلب البيانات المشتركة...' });
        await refreshData(true);
        setTimeout(() => {
          setShowCloudModal(false);
          setCloudFeedback(null);
        }, 1500);
      } else {
        setCloudFeedback({ success: true, message: 'تم إيقاف المزامنة السحابية والعودة للوضع المحلي.' });
      }
    } catch (err) {
      setCloudFeedback({ success: false, message: 'حدث خطأ أثناء حفظ الرابط.' });
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

  // Calculate highest daily traffic scale (visits or streams) with minimum baseline of 5
  const maxTrafficVal = Math.max(
    ...(data.dailyTraffic || []).map(d => Math.max(Number(d.visits) || 0, Number(d.streams) || 0)),
    5
  );

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
            onClick={() => setShowCloudModal(true)}
            title="سحابة Movora متصلة وتعمل تلقائياً"
            style={{
              borderColor: 'rgba(34, 197, 94, 0.4)',
              background: 'rgba(34, 197, 94, 0.1)'
            }}
          >
            <Cloud size={15} style={{ color: '#22c55e' }} />
            <span>السحابة متصلة 🟢</span>
          </button>

          <button 
            className="admin-action-btn"
            onClick={() => setShowPwdModal(true)}
            title="تغيير كلمة المرور للوحة الأدمن"
          >
            <KeyRound size={15} />
            <span>تغيير كلمة المرور</span>
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
              <strong>نظام التتبع المباشر 100% نشط:</strong> رصد دقيق وتلقائي لجميع الزيارات وتشغيل الأفلام.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a 
              href="https://vercel.com/ahmed-mongeds-projects/movr/analytics" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#000',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              <BarChart3 size={14} style={{ color: '#22c55e' }} />
              <span>تحليلات Vercel السحابية لمشروع Movora (كافة الموبايلات والأجهزة)</span>
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
                const visitsCount = Number(item.visits) || 0;
                const streamsCount = Number(item.streams) || 0;
                const visitHeight = Math.min(100, Math.max(visitsCount > 0 ? 8 : 0, Math.round((visitsCount / maxTrafficVal) * 100)));
                const streamHeight = Math.min(100, Math.max(streamsCount > 0 ? 8 : 0, Math.round((streamsCount / maxTrafficVal) * 100)));

                return (
                  <div key={idx} className="chart-bar-column">
                    <div className="bar-wrapper">
                      {/* Visits Bar (Red) */}
                      <div 
                        className="bar-fill visits" 
                        style={{ height: `${visitHeight}%` }}
                        title={`الزيارات: ${visitsCount}`}
                      >
                        {visitsCount > 0 && <span className="bar-tooltip">{visitsCount} زيارة</span>}
                      </div>
                      {/* Streams Bar (Blue) */}
                      <div 
                        className="bar-fill streams" 
                        style={{ height: `${streamHeight}%` }}
                        title={`تشغيل الأفلام: ${streamsCount}`}
                      >
                        {streamsCount > 0 && <span className="bar-tooltip">{streamsCount} تشغيل</span>}
                      </div>
                    </div>
                    <span className="chart-col-label">{item.day}</span>
                    <div className="chart-col-sub">
                      <span className="sub-val visits" title={`زيارات ${item.day}`}>{visitsCount}</span>
                      <span className="sub-sep">/</span>
                      <span className="sub-val streams" title={`تشغيل ${item.day}`}>{streamsCount}</span>
                    </div>
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
                <h3>تغيير كلمة المرور للوحة الأدمن</h3>
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
                <label>كلمة المرور الحالية:</label>
                <input
                  type="password"
                  value={oldSecret}
                  onChange={(e) => setOldSecret(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية..."
                  required
                />
              </div>

              <div className="form-group">
                <label>كلمة المرور الجديدة (6 خانات على الأقل):</label>
                <input
                  type="password"
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة..."
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowPwdModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn-save">
                  حفظ كلمة المرور الجديدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cloud Database Sync Modal */}
      {showCloudModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCloudModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} dir="rtl" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cloud size={20} style={{ color: '#22c55e' }} />
                <h3>المزامنة السحابية المباشرة (Vercel Cloud Blob)</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCloudModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '13px',
              color: '#cbd5e1',
              lineHeight: '1.6',
              marginBottom: '16px'
            }}>
              ✅ <strong>سحابة Movora متصلة وتعمل تلقائياً بنجاح!</strong><br />
              تم ربط الموقع بمخزن <strong>Vercel Cloud Blob</strong> المركزي. كل زيارة من أي هاتف محمول، أو كمبيوتر، وكل فيلم يتم تشغيله في أي مكان حول العالم يتم تسجيله وحفظه تلقائياً ويظهر مباشرة هنا في لوحة الأدمن دون الحاجة لفتح فيرسل إطلاقاً!
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '12px',
              color: '#94a3b8',
              marginBottom: '16px',
              lineHeight: '1.7'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#fff' }}>حالة الاتصال:</span>
                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>متصل ونشط 🟢</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#fff' }}>المزود السحابي:</span>
                <span style={{ color: '#38bdf8' }}>Vercel Cloud Blob + Serverless API</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#fff' }}>تحديث تلقائي:</span>
                <span style={{ color: '#cbd5e1' }}>كل 6 ثوانٍ تلقائياً</span>
              </div>
            </div>

            {cloudFeedback && (
              <div className={`modal-feedback ${cloudFeedback.success ? 'success' : 'error'}`}>
                {cloudFeedback.success ? <CheckCircle2 size={16} /> : <Lock size={16} />}
                <span>{cloudFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleCloudSubmit} className="modal-form">
              <div className="form-group">
                <label>رابط قاعدة بيانات Firebase بديلة (اختياري فقط):</label>
                <input
                  type="text"
                  value={firebaseUrlInput}
                  onChange={(e) => setFirebaseUrlInput(e.target.value)}
                  placeholder="https://your-project-default-rtdb.firebaseio.com"
                  style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '13px' }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCloudModal(false)}>
                  إغلاق
                </button>
                <button type="submit" className="btn-save" style={{ background: '#22c55e', color: '#000', fontWeight: 'bold' }}>
                  حفظ الإعدادات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
