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
  Database,
  DollarSign,
  Sparkles,
  Shield,
  AlertCircle,
  Send,
  Inbox,
  CheckSquare,
  Square,
  Clapperboard,
  Calendar,
  MessageSquare,
  AtSign,
  Search,
  Crown,
  Plus,
  Copy,
  Check
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getAdSettings, saveAdSettingsToCloud, extractVerificationCode, purgeAdminAds } from '../../services/adShield';
import TelegramPublisherModal from '../../components/admin/TelegramPublisherModal';
import { fetchVipCodes, createVipCode, deleteVipCode, generateRandomCodePrefix } from '../../services/vipService';
import { 
  loadAnalytics, 
  fetchGlobalAnalytics,
  getLiveActiveUsersCount, 
  getDevicePercentages,
  getBrowserPercentages,
  resetAnalyticsData, 
  exportAnalyticsJson,
  recordHeartbeat,
  deleteMovieRequest,
  toggleMovieRequestStatus,
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

  // Ads Modal State
  const [showAdsModal, setShowAdsModal] = useState(false);
  const [adSettings, setAdSettings] = useState(() => getAdSettings());
  const [isSavingAds, setIsSavingAds] = useState(false);
  const [adsFeedback, setAdsFeedback] = useState(null);

  // Telegram Smart Publisher Modal State
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramPreloadQuery, setTelegramPreloadQuery] = useState('');

  // VIP Promo Codes Modal State
  const [showVipAdminModal, setShowVipAdminModal] = useState(false);
  const [vipCodesList, setVipCodesList] = useState([]);
  const [isLoadingVip, setIsLoadingVip] = useState(false);
  const [newCodeDuration, setNewCodeDuration] = useState(30);
  const [newCodeCustom, setNewCodeCustom] = useState(() => generateRandomCodePrefix(30));
  const [newCodeNote, setNewCodeNote] = useState('');
  const [vipActionFeedback, setVipActionFeedback] = useState(null);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const loadVipCodes = useCallback(async () => {
    setIsLoadingVip(true);
    const res = await fetchVipCodes();
    if (res.success) {
      setVipCodesList(res.vipCodes || []);
    }
    setIsLoadingVip(false);
  }, []);

  useEffect(() => {
    if (showVipAdminModal) {
      loadVipCodes();
      setVipActionFeedback(null);
    }
  }, [showVipAdminModal, loadVipCodes]);

  const handleCreateVipCode = async (e) => {
    e.preventDefault();
    if (!newCodeCustom.trim()) return;

    setVipActionFeedback(null);
    let planName = `${newCodeDuration} يوم`;
    if (newCodeDuration === 30) planName = 'شهر (30 يوم)';
    else if (newCodeDuration === 90) planName = '3 شهور (90 يوم)';
    else if (newCodeDuration === 180) planName = '6 شهور (180 يوم)';
    else if (newCodeDuration === 365) planName = 'سنة كاملة (365 يوم)';
    else if (newCodeDuration >= 9000) planName = 'مدى الحياة 👑';

    const res = await createVipCode({
      code: newCodeCustom.trim(),
      durationDays: newCodeDuration,
      planName,
      note: newCodeNote.trim()
    });

    if (res.success) {
      setVipCodesList(res.vipCodes || []);
      setVipActionFeedback({ type: 'success', message: `تم إنشاء الكود بنجاح: ${res.code.code}` });
      setNewCodeCustom(generateRandomCodePrefix(newCodeDuration));
      setNewCodeNote('');
    } else {
      setVipActionFeedback({ type: 'error', message: res.error || 'تعذر إنشاء الكود' });
    }
  };

  const handleDeleteVipCode = async (codeId, codeStr) => {
    if (!window.confirm(`هل أنت متأكد من حذف وإلغاء الكود ${codeStr}؟`)) return;
    const res = await deleteVipCode(codeId, codeStr);
    if (res.success) {
      setVipCodesList(res.vipCodes || []);
    }
  };

  const handleCopyVipCode = (codeStr, codeId) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(codeStr);
      setCopiedCodeId(codeId);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  // Movie Request Actions
  const handleToggleRequestStatus = async (requestId) => {
    try {
      await toggleMovieRequestStatus(requestId);
      setData(prev => {
        const nextReqs = (prev.movieRequests || []).map(r => 
          r.id === requestId 
            ? { ...r, status: r.status === 'fulfilled' ? 'pending' : 'fulfilled' } 
            : r
        );
        return { ...prev, movieRequests: nextReqs };
      });
    } catch (e) {
      console.warn('Failed to toggle request status:', e);
    }
  };

  const handleDeleteRequest = async (requestId, title) => {
    if (window.confirm(`هل أنت متأكد من حذف طلب فيلم "${title}"؟`)) {
      try {
        await deleteMovieRequest(requestId);
        setData(prev => ({
          ...prev,
          movieRequests: (prev.movieRequests || []).filter(r => r.id !== requestId)
        }));
      } catch (e) {
        console.warn('Failed to delete request:', e);
      }
    }
  };

  const handlePublishRequestedMovie = (title) => {
    setTelegramPreloadQuery(title);
    setShowTelegramModal(true);
  };

  // Load real global analytics data from cloud
  const refreshData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsRefreshing(true);
    recordHeartbeat();
    try {
      const current = await fetchGlobalAnalytics();
      if (current) {
        setData(current);
        setLiveUsers(current.liveActiveCount || 1);
        if (current.adSettings) {
          setAdSettings(prev => ({ ...prev, ...current.adSettings }));
        }
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

    // Keep admin portal completely ad-free
    purgeAdminAds();
    const purgeInterval = setInterval(purgeAdminAds, 600);

    return () => {
      clearInterval(timeInterval);
      clearInterval(cloudPollInterval);
      clearInterval(purgeInterval);
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

  // Handle Ads Settings Save
  const handleSaveAds = async (e) => {
    e.preventDefault();
    setIsSavingAds(true);
    setAdsFeedback(null);
    try {
      const res = await saveAdSettingsToCloud(adSettings);
      if (res.success) {
        setAdsFeedback({ success: true, message: 'تم حفظ وتفعيل إعدادات الإعلانات سحابياً بنجاح!' });
        setTimeout(() => {
          setAdsFeedback(null);
        }, 3000);
      } else {
        setAdsFeedback({ success: false, message: 'حدث خطأ أثناء الحفظ في السحابة.' });
      }
    } catch (err) {
      setAdsFeedback({ success: false, message: err.message });
    } finally {
      setIsSavingAds(false);
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
            className="admin-action-btn ads-btn"
            onClick={() => setShowAdsModal(true)}
            title="إدارة إعلانات الموقع وأرباح Adsterra ودرع الحماية"
            style={{
              borderColor: 'rgba(234, 179, 8, 0.4)',
              background: 'rgba(234, 179, 8, 0.1)',
              color: '#facc15'
            }}
          >
            <DollarSign size={15} style={{ color: '#facc15' }} />
            <span>إعلانات الموقع والأرباح 💰</span>
          </button>

          <button 
            className="admin-action-btn vip-btn"
            onClick={() => setShowVipAdminModal(true)}
            title="إدارة اشتراكات وأكواد VIP وتوليد أكواد المشاهدة بدون إعلانات"
            style={{
              borderColor: 'rgba(250, 204, 21, 0.45)',
              background: 'rgba(250, 204, 21, 0.12)',
              color: '#facc15'
            }}
          >
            <Crown size={15} style={{ color: '#facc15' }} />
            <span>أكواد واشتراكات VIP 👑</span>
          </button>

          <button 
            className="admin-action-btn tg-publisher-btn"
            onClick={() => setShowTelegramModal(true)}
            title="أداة النشر التلقائي الذكي على تليجرام"
            style={{
              borderColor: 'rgba(56, 189, 248, 0.45)',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8'
            }}
          >
            <Send size={15} style={{ color: '#38bdf8' }} />
            <span>نشر على تليجرام 📢</span>
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
          marginBottom: '16px',
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

        {/* Ads & Revenue Bar */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(234, 179, 8, 0.2)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#facc15'
            }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '15px', color: '#fff' }}>أرباح الموقع وإعلانات Adsterra</strong>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: adSettings.enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                  color: adSettings.enabled ? '#4ade80' : '#94a3b8',
                  border: `1px solid ${adSettings.enabled ? 'rgba(34, 197, 94, 0.4)' : 'rgba(148, 163, 184, 0.3)'}`,
                  fontWeight: 'bold'
                }}>
                  {adSettings.enabled ? 'إعلاناتك نشطة 🟢' : 'الإعلانات متوقفة ⚪'}
                </span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <ShieldCheck size={12} /> درع حظر الإعلانات الإباحية: مفعّل 🛡️
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                إعلانات شبكة Adsterra (Popunder و Social Bar) مدمجة لجميع الزوار مع حماية كاملة للوحة الإدارة.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAdsModal(true)}
            style={{
              background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
              color: '#000',
              fontWeight: 'bold',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(234, 179, 8, 0.25)'
            }}
          >
            <Sparkles size={15} />
            <span>إدارة الإعلانات والأرباح</span>
          </button>
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

        {/* Row: Visitor Movie Requests (طلبات الأفلام من المشاهدين) */}
        <section className="admin-requests-section" style={{ marginBottom: '24px' }}>
          <div className="admin-panel-card" style={{ width: '100%' }}>
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255, 49, 90, 0.15)',
                  border: '1px solid rgba(255, 49, 90, 0.35)',
                  color: '#ff315a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Inbox size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>طلبات الأفلام من الزوار 📬</h3>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(255, 49, 90, 0.15)',
                      color: '#ff315a',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255, 49, 90, 0.3)'
                    }}>
                      {(data.movieRequests || []).length} طلب
                    </span>
                    {(data.movieRequests || []).filter(r => r.status !== 'fulfilled').length > 0 && (
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(234, 179, 8, 0.15)',
                        color: '#facc15',
                        fontWeight: 'bold',
                        border: '1px solid rgba(234, 179, 8, 0.3)'
                      }}>
                        {(data.movieRequests || []).filter(r => r.status !== 'fulfilled').length} بانتظار التوفير ⏳
                      </span>
                    )}
                  </div>
                  <p className="panel-sub" style={{ margin: '4px 0 0 0' }}>
                    الأفلام والمسلسلات التي يطلبها المشاهدون مع إمكانية توفيرها ونشرها مباشرة لقناة التليجرام @movora_me
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => refreshData(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={12} className={isRefreshing ? 'spin-icon' : ''} />
                  <span>تحديث الطلبات</span>
                </button>
              </div>
            </div>

            <div className="top-movies-table-wrapper" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الحالة</th>
                    <th>اسم الفيلم المطلوب</th>
                    <th>السنة</th>
                    <th>ملاحظات وتفاصيل المشاهد</th>
                    <th>التواصل</th>
                    <th>وقت الطلب والجهاز</th>
                    <th>إجراءات سريعة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movieRequests && data.movieRequests.length > 0 ? (
                    data.movieRequests.map((req) => {
                      const isFulfilled = req.status === 'fulfilled';
                      const timeStr = req.createdAt 
                        ? new Date(req.createdAt).toLocaleString('ar-EG', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                        : 'حديث';

                      return (
                        <tr key={req.id} style={{ opacity: isFulfilled ? 0.7 : 1 }}>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleRequestStatus(req.id)}
                              style={{
                                background: isFulfilled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                border: `1px solid ${isFulfilled ? 'rgba(34, 197, 94, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
                                color: isFulfilled ? '#4ade80' : '#facc15',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontSize: '11.5px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              title="اضغط لتغيير الحالة بين (تم التوفير / قيد الانتظار)"
                            >
                              {isFulfilled ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                              <span>{isFulfilled ? 'تم التوفير ✅' : 'قيد الانتظار ⏳'}</span>
                            </button>
                          </td>
                          <td className="movie-cell">
                            <strong style={{ color: '#fff', fontSize: '14px' }}>{req.title}</strong>
                          </td>
                          <td>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{req.year || '—'}</span>
                          </td>
                          <td>
                            <span style={{ color: '#cbd5e1', fontSize: '12px', maxWidth: '200px', display: 'inline-block' }}>
                              {req.notes || '—'}
                            </span>
                          </td>
                          <td>
                            {req.contact ? (
                              <span style={{ color: '#38bdf8', fontSize: '12px', direction: 'ltr', display: 'inline-block' }}>
                                {req.contact}
                              </span>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                              <span>{timeStr}</span>
                              <span style={{ margin: '0 4px' }}>•</span>
                              <span>{req.device || 'Desktop'}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {/* Publish to Telegram */}
                              <button
                                type="button"
                                onClick={() => handlePublishRequestedMovie(req.title)}
                                style={{
                                  background: 'rgba(0, 136, 204, 0.15)',
                                  border: '1px solid rgba(0, 136, 204, 0.4)',
                                  color: '#38bdf8',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="نشر إشعار توفر هذا الفيلم لقناة التليجرام @movora_me"
                              >
                                <Send size={11} />
                                <span>نشر تليجرام</span>
                              </button>

                              {/* Search site for this movie */}
                              <Link
                                to={`/?q=${encodeURIComponent(req.title)}`}
                                target="_blank"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.12)',
                                  color: '#cbd5e1',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="فحص وجود الفيلم في الموقع"
                              >
                                <Search size={11} />
                                <span>فحص</span>
                              </Link>

                              {/* Delete Request */}
                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(req.id, req.title)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  padding: '5px 7px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                                title="حذف هذا الطلب"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px 14px', color: '#717688' }}>
                        لا توجد طلبات أفلام مسجلة حتى الآن — ستظهر هنا فوراً بمجرد قيام أي زائر بطلب فيلم من الموقع!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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

      {/* Ads Management Modal */}
      {showAdsModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAdsModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} dir="rtl" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={22} style={{ color: '#facc15' }} />
                <h3>إدارة إعلانات Adsterra وأرباح الموقع 💰</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAdsModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Anti-Adult Protection Shield Alert */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '13px',
              color: '#cbd5e1',
              lineHeight: '1.6',
              marginBottom: '16px'
            }}>
              🛡️ <strong>درع حماية موفورا مفعّل تلقائياً:</strong><br />
              مشغل الأفلام مضبوط على سيرفر <strong>VidLink HD</strong> النقي الخالي من النوافذ المنبثقة الإباحية، مع حماية لوحة الإدارة من أي إعلانات مزعجة.
            </div>

            {adsFeedback && (
              <div className={`modal-feedback ${adsFeedback.success ? 'success' : 'error'}`}>
                {adsFeedback.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{adsFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveAds} className="modal-form">
              {/* Toggle Enable Ads */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#fff', display: 'block' }}>
                    تفعيل إعلانات Adsterra في الموقع
                  </strong>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    إعلانات Popunder و Social Bar نشطة وتعمل لجميع الزوار لتحقيق الأرباح.
                  </span>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={adSettings.enabled || false}
                    onChange={(e) => setAdSettings({ ...adSettings, enabled: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#eab308' }}
                  />
                </label>
              </div>

              {/* Optional Player Banner Slot */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label>كود بانر مخصص أسفل مشغل الأفلام (Player Banner - اختياري):</label>
                <textarea
                  rows="2"
                  value={adSettings.bannerPlayerCode || ''}
                  onChange={(e) => setAdSettings({ ...adSettings, bannerPlayerCode: e.target.value })}
                  placeholder='الصق كود إعلان البانر لو أردت ظهوره تحت الفيديو مباشرة...'
                  style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                />
              </div>

              {/* Adsterra Info Guide */}
              <div style={{
                background: 'rgba(234, 179, 8, 0.05)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12px',
                color: '#cbd5e1',
                lineHeight: '1.7',
                marginBottom: '18px'
              }}>
                <strong style={{ color: '#facc15' }}>✨ إعلانات Adsterra المثبتة في الموقع:</strong>
                <ul style={{ paddingRight: '18px', margin: '6px 0 0 0' }}>
                  <li><strong>Popunder:</strong> إعلان فتحة نافذة منبثقة ربحية عند أول نقرة للزائر.</li>
                  <li><strong>Social Bar:</strong> شريط إعلاني تفاعلي ذكي وسلس في أسفل الشاشة.</li>
                  <li><strong>لوحة الإدارة:</strong> محمية دائماً وبشكل تلقائي من ظهور أي إعلانات لك.</li>
                </ul>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAdsModal(false)}>
                  إغلاق
                </button>
                <button 
                  type="submit" 
                  className="btn-save" 
                  disabled={isSavingAds}
                  style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#000', fontWeight: 'bold' }}
                >
                  {isSavingAds ? 'جاري الحفظ في السحابة...' : 'حفظ وتفعيل سحابي فوراً 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Telegram Smart Publisher Modal */}
      {showTelegramModal && (
        <TelegramPublisherModal 
          onClose={() => {
            setShowTelegramModal(false);
            setTelegramPreloadQuery('');
          }} 
          initialQuery={telegramPreloadQuery}
        />
      )}

      {/* VIP Promo Codes & Subscriptions Modal */}
      {showVipAdminModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowVipAdminModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} dir="rtl" style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(250, 204, 21, 0.15)',
                  border: '1px solid rgba(250, 204, 21, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#facc15'
                }}>
                  <Crown size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>إدارة اشتراكات وأكواد Movora VIP 👑</h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>توليد أكواد المشاهدة بدون إعلانات ومتابعة المشتركين</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowVipAdminModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Quick KPI stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              padding: '16px 20px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>إجمالي الأكواد المُصدرة</span>
                <strong style={{ display: 'block', fontSize: '20px', color: '#fff', marginTop: '2px' }}>
                  {vipCodesList.length}
                </strong>
              </div>
              <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                <span style={{ fontSize: '12px', color: '#86efac' }}>الأكواد النشطة (جاهزة للبيع)</span>
                <strong style={{ display: 'block', fontSize: '20px', color: '#4ade80', marginTop: '2px' }}>
                  {vipCodesList.filter(c => c.status === 'active').length}
                </strong>
              </div>
              <div style={{ background: 'rgba(250, 204, 21, 0.08)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(250, 204, 21, 0.25)' }}>
                <span style={{ fontSize: '12px', color: '#fde047' }}>المشتركين المفعلين (تم التفعيل)</span>
                <strong style={{ display: 'block', fontSize: '20px', color: '#facc15', marginTop: '2px' }}>
                  {vipCodesList.filter(c => c.status === 'redeemed').length}
                </strong>
              </div>
            </div>

            {/* Form: Generate New VIP Code */}
            <form onSubmit={handleCreateVipCode} style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <strong style={{ display: 'block', fontSize: '14.5px', color: '#facc15', marginBottom: '12px' }}>
                ✨ توليد كود تفعيل VIP جديد:
              </strong>

              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>مدة الباقة:</label>
                  <select 
                    value={newCodeDuration}
                    onChange={(e) => {
                      const dur = Number(e.target.value);
                      setNewCodeDuration(dur);
                      setNewCodeCustom(generateRandomCodePrefix(dur));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value={30}>شهر (30 يوم)</option>
                    <option value={90}>3 شهور (90 يوم)</option>
                    <option value={180}>6 شهور (180 يوم)</option>
                    <option value={365}>سنة (365 يوم)</option>
                    <option value={9999}>مدى الحياة 👑</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>رمز الكود:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="text"
                      value={newCodeCustom}
                      onChange={(e) => setNewCodeCustom(e.target.value.toUpperCase())}
                      placeholder="VIP-MOV-XXXX"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(250, 204, 21, 0.4)',
                        borderRadius: '8px',
                        color: '#facc15',
                        fontWeight: '800',
                        fontFamily: 'monospace',
                        direction: 'ltr',
                        textAlign: 'center',
                        fontSize: '13.5px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setNewCodeCustom(generateRandomCodePrefix(newCodeDuration))}
                      title="توليد كود عشوائي جديد"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#cbd5e1',
                        borderRadius: '8px',
                        padding: '0 10px',
                        cursor: 'pointer'
                      }}
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>ملاحظة العميل (اختياري):</label>
                  <input 
                    type="text"
                    value={newCodeNote}
                    onChange={(e) => setNewCodeNote(e.target.value)}
                    placeholder="مثال: أحمد - فودافون كاش"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  style={{
                    background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                    color: '#0f172a',
                    fontWeight: '800',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    height: '40px',
                    fontFamily: 'inherit'
                  }}
                >
                  <Plus size={16} />
                  <span>إنشاء الكود</span>
                </button>
              </div>

              {vipActionFeedback && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: vipActionFeedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${vipActionFeedback.type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  color: vipActionFeedback.type === 'success' ? '#4ade80' : '#f87171'
                }}>
                  {vipActionFeedback.message}
                </div>
              )}
            </form>

            {/* List of existing VIP Codes */}
            <div style={{ padding: '20px', maxHeight: '380px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <strong style={{ fontSize: '14px', color: '#fff' }}>📋 سجل الأكواد المنشأة:</strong>
                <button 
                  type="button" 
                  onClick={loadVipCodes}
                  disabled={isLoadingVip}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: 'inherit'
                  }}
                >
                  <RefreshCw size={13} className={isLoadingVip ? 'spin' : ''} />
                  <span>تحديث السجل</span>
                </button>
              </div>

              {vipCodesList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '13px' }}>
                  لا توجد أكواد منشأة حالياً. قم بإنشاء أول كود للأعضاء بالأعلى! ☝️
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {vipCodesList.map((item) => (
                    <div 
                      key={item.id || item.code}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: item.status === 'redeemed' ? 'rgba(250, 204, 21, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${item.status === 'redeemed' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`,
                        gap: '12px'
                      }}
                    >
                      {/* Code and Copy */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          fontWeight: '800',
                          color: item.status === 'redeemed' ? '#94a3b8' : '#facc15',
                          textDecoration: item.status === 'redeemed' ? 'line-through' : 'none'
                        }}>
                          {item.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyVipCode(item.code, item.id)}
                          title="نسخ الكود لإرساله للعميل"
                          style={{
                            background: copiedCodeId === item.id ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            border: `1px solid ${copiedCodeId === item.id ? '#22c55e' : 'rgba(255, 255, 255, 0.15)'}`,
                            color: copiedCodeId === item.id ? '#4ade80' : '#cbd5e1',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontFamily: 'inherit'
                          }}
                        >
                          {copiedCodeId === item.id ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedCodeId === item.id ? 'تم!' : 'نسخ'}</span>
                        </button>
                      </div>

                      {/* Plan / Duration */}
                      <div style={{ fontSize: '12.5px', color: '#cbd5e1' }}>
                        {item.planName || `${item.durationDays} يوم`}
                      </div>

                      {/* Note */}
                      <div style={{ fontSize: '12px', color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.note || '—'}
                      </div>

                      {/* Status */}
                      <div>
                        {item.status === 'active' && (
                          <span style={{
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#4ade80',
                            border: '1px solid rgba(34, 197, 94, 0.35)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            جاهز 🟢
                          </span>
                        )}
                        {item.status === 'redeemed' && (
                          <span style={{
                            background: 'rgba(250, 204, 21, 0.15)',
                            color: '#facc15',
                            border: '1px solid rgba(250, 204, 21, 0.35)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            تم التفعيل 👑
                          </span>
                        )}
                        {item.status === 'cancelled' && (
                          <span style={{
                            background: 'rgba(148, 163, 184, 0.15)',
                            color: '#94a3b8',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px'
                          }}>
                            ملغي ⚪
                          </span>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteVipCode(item.id, item.code)}
                        title="حذف وإلغاء الكود"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#f87171',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button type="button" className="btn-cancel" onClick={() => setShowVipAdminModal(false)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
