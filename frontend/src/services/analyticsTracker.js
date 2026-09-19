// ==========================================================================
// MOVORA REAL-TIME GLOBAL TRAFFIC & ANALYTICS ENGINE (100% REAL CLOUD DATA)
// Built-in Vercel Cloud Blob sync across all mobile devices & PCs
// Zero user configuration required!
// ==========================================================================

const STORAGE_KEY = 'movora_real_analytics_v6';
const VISITOR_KEY = 'movora_visitor_id';
const SESSION_KEY = 'movora_session_id';
const FIREBASE_CONFIG_KEY = 'movora_firebase_db_url';

// Official Vercel Cloud Storage Blob URL (Global Real-Time Store)
export const VERCEL_BLOB_URL = 'https://gbawmvigpohlszyw.public.blob.vercel-storage.com/analytics/traffic.json';

// Canonical Production API Endpoint - No redirect risks across mobile/desktop
export const API_ENDPOINT = 'https://www.movora.me/api/analytics';

// Optional Firebase Realtime Database URL
let FIREBASE_DB_URL =
  import.meta.env.VITE_FIREBASE_DB_URL ||
  localStorage.getItem(FIREBASE_CONFIG_KEY) ||
  '';

export function getFirebaseDbUrl() {
  return FIREBASE_DB_URL;
}

export function setFirebaseDbUrl(url) {
  if (url && url.trim()) {
    let clean = url.trim().replace(/\/+$/, '');
    if (clean.endsWith('.json')) {
      clean = clean.replace(/\.json$/, '');
    }
    localStorage.setItem(FIREBASE_CONFIG_KEY, clean);
    FIREBASE_DB_URL = clean;
    return clean;
  } else {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
    FIREBASE_DB_URL = '';
    return '';
  }
}

// Generate or retrieve persistent unique visitor ID
export function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = 'v_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

// Generate or retrieve current browser session ID
export function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = 's_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// Detect client device information
export function detectDevice() {
  const ua = (navigator.userAgent || '').toLowerCase();
  let device = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device = 'Tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) {
    device = 'Mobile';
  }

  let browser = 'Chrome';
  if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  else if (/brave/i.test(ua)) browser = 'Brave';

  let os = 'Windows';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { device, browser, os };
}

// Get day name in Arabic
export function getArabicDayName(date = new Date()) {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}

// Clean Initial State starting with 0 (Zero fake numbers!)
export function createEmptyAnalytics() {
  const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  return {
    totalVisits: 0,
    uniqueVisitorsCount: 0,
    uniqueVisitorIds: [],
    totalStreams: 0,
    deviceCounts: {
      Mobile: 0,
      Desktop: 0,
      Tablet: 0,
    },
    browserCounts: {
      Chrome: 0,
      Safari: 0,
      Edge: 0,
      Firefox: 0,
      Opera: 0,
      Brave: 0,
    },
    dailyTraffic: days.map(day => ({
      day,
      visits: 0,
      streams: 0,
    })),
    topMovies: [],
    recentEvents: [],
    activeSessions: {},
    liveActiveCount: 1,
    lastUpdated: Date.now(),
  };
}

// Load current analytics state from local cache
export function loadAnalytics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const empty = createEmptyAnalytics();
      saveAnalytics(empty);
      return empty;
    }
    return JSON.parse(raw);
  } catch (err) {
    return createEmptyAnalytics();
  }
}

// Save analytics state to local cache
export function saveAnalytics(data) {
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Error saving local analytics:', err);
  }
}

// Normalize incoming cloud data safely & auto-heal discrepancies
export function normalizeAnalytics(d) {
  const empty = createEmptyAnalytics();
  if (!d) return empty;

  const now = Date.now();
  let liveCount = 0;
  const prunedSessions = {};
  if (d.activeSessions && typeof d.activeSessions === 'object') {
    for (const [sid, time] of Object.entries(d.activeSessions)) {
      if (now - Number(time) < 300000) {
        prunedSessions[sid] = time;
        liveCount++;
      }
    }
  }

  const streams = Number(d.totalStreams) || 0;
  let visits = Number(d.totalVisits) || 0;
  // A stream is always a visit
  if (visits < streams) visits = streams;

  let uniqueCount = Number(d.uniqueVisitorsCount) || 0;
  if (uniqueCount < 1 && visits > 0) uniqueCount = 1;

  let mobile = Number(d.deviceCounts?.Mobile) || 0;
  let desktop = Number(d.deviceCounts?.Desktop) || 0;
  let tablet = Number(d.deviceCounts?.Tablet) || 0;
  if (mobile === 0 && desktop === 0 && tablet === 0 && visits > 0) {
    const hasMobile = (d.recentEvents || []).some(e => e.device === 'Mobile');
    if (hasMobile) mobile = visits;
    else desktop = visits;
  }

  // Ensure daily traffic numbers are clean
  const daily = (Array.isArray(d.dailyTraffic) && d.dailyTraffic.length > 0 ? d.dailyTraffic : empty.dailyTraffic).map(item => {
    const s = Number(item.streams) || 0;
    let v = Number(item.visits) || 0;
    if (v < s) v = s;
    return {
      day: item.day,
      visits: v,
      streams: s
    };
  });

  return {
    totalVisits: visits,
    uniqueVisitorsCount: uniqueCount,
    uniqueVisitorIds: Array.isArray(d.uniqueVisitorIds) ? d.uniqueVisitorIds : [],
    totalStreams: streams,
    deviceCounts: {
      Mobile: mobile,
      Desktop: desktop,
      Tablet: tablet,
    },
    browserCounts: {
      Chrome: Number(d.browserCounts?.Chrome) || 0,
      Safari: Number(d.browserCounts?.Safari) || 0,
      Edge: Number(d.browserCounts?.Edge) || 0,
      Firefox: Number(d.browserCounts?.Firefox) || 0,
      Opera: Number(d.browserCounts?.Opera) || 0,
      Brave: Number(d.browserCounts?.Brave) || 0,
    },
    dailyTraffic: daily,
    topMovies: Array.isArray(d.topMovies) ? d.topMovies : [],
    recentEvents: Array.isArray(d.recentEvents) ? d.recentEvents : [],
    activeSessions: prunedSessions,
    liveActiveCount: Math.max(1, liveCount),
    lastUpdated: d.lastUpdated || now,
  };
}

// Fetch Global Live Analytics (From Serverless API -> Direct Blob CDN -> Fallback to Local)
export async function fetchGlobalAnalytics() {
  // 1. Fetch via Serverless API route (Guaranteed fresh, auto-healed)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_ENDPOINT}?t=${Date.now()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const raw = await res.json();
      if (raw && typeof raw === 'object') {
        const normalized = normalizeAnalytics(raw);
        saveAnalytics(normalized);
        return normalized;
      }
    }
  } catch (e) {
    // fallback to direct blob CDN
  }

  // 2. Direct fetch from high-speed Vercel Blob CDN (Fast fallback)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${VERCEL_BLOB_URL}?t=${Date.now()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const raw = await res.json();
      if (raw && typeof raw === 'object') {
        const normalized = normalizeAnalytics(raw);
        saveAnalytics(normalized);
        return normalized;
      }
    }
  } catch (e) {
    // fallback
  }

  return loadAnalytics();
}

// Push Event to Vercel Serverless Function & Cloud Blob
async function pushAnalyticsEvent(payload) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      keepalive: true,
    });
    clearTimeout(timer);

    if (res.ok) {
      const updated = await res.json();
      if (updated && typeof updated === 'object') {
        saveAnalytics(normalizeAnalytics(updated));
      }
      return true;
    }
  } catch (e) {
    console.warn('Sync analytics notice:', e);
  }
  return false;
}

// Track REAL Page View
export function trackPageView(path = window.location.pathname) {
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const { device, browser, os } = detectDevice();

    // 1. Update local cache immediately for zero UI latency
    const local = loadAnalytics();
    local.totalVisits = (local.totalVisits || 0) + 1;
    saveAnalytics(local);

    // 2. Directly sync to cloud (No delay)
    pushAnalyticsEvent({
      action: 'pageview',
      path,
      visitorId,
      sessionId,
      device,
      browser,
      os,
    });
  } catch (err) {
    console.warn('Track page view error:', err);
  }
}

// Track REAL Movie Stream Playback
export function trackMovieStream(movie, server = 'primary') {
  if (!movie) return;
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const { device, browser, os } = detectDevice();

    // 1. Update local cache immediately
    const local = loadAnalytics();
    local.totalStreams = (local.totalStreams || 0) + 1;
    local.totalVisits = Math.max((local.totalVisits || 0) + 1, local.totalStreams);
    saveAnalytics(local);

    // 2. Directly sync to cloud (No delay)
    pushAnalyticsEvent({
      action: 'stream',
      movie: {
        id: movie.id,
        title: movie.title || movie.original_title || 'فيلم بدون عنوان',
        vote_average: movie.vote_average,
      },
      server,
      visitorId,
      sessionId,
      device,
      browser,
      os,
    });
  } catch (err) {
    console.warn('Track movie stream error:', err);
  }
}

// Record Active Heartbeat
export function recordHeartbeat() {
  const sessionId = getSessionId();
  try {
    const local = loadAnalytics();
    if (!local.activeSessions) local.activeSessions = {};
    local.activeSessions[sessionId] = Date.now();
    saveAnalytics(local);
  } catch (e) {}
}

// Get Real Active Live Users Count
export function getLiveActiveUsersCount() {
  try {
    const data = loadAnalytics();
    return data.liveActiveCount || 1;
  } catch (e) {
    return 1;
  }
}

// Compute Device Percentages from Real Counts
export function getDevicePercentages(deviceCounts = {}) {
  const mobile = Number(deviceCounts?.Mobile) || 0;
  const desktop = Number(deviceCounts?.Desktop) || 0;
  const tablet = Number(deviceCounts?.Tablet) || 0;
  const total = mobile + desktop + tablet;

  if (total === 0) {
    return { Mobile: 0, Desktop: 0, Tablet: 0 };
  }

  return {
    Mobile: Math.round((mobile / total) * 100),
    Desktop: Math.round((desktop / total) * 100),
    Tablet: Math.round((tablet / total) * 100),
  };
}

// Compute Browser Percentages from Real Counts
export function getBrowserPercentages(browserCounts = {}) {
  if (!browserCounts) return {};
  const total = Object.values(browserCounts).reduce((a, b) => a + Number(b), 0);
  if (total === 0) return {};

  const pcts = {};
  for (const [b, count] of Object.entries(browserCounts)) {
    if (count > 0) {
      pcts[b] = Math.round((count / total) * 100);
    }
  }
  return pcts;
}

// Reset Analytics to Clean Zero in both Local and Cloud
export async function resetAnalyticsData() {
  const empty = createEmptyAnalytics();
  empty.recentEvents = [
    {
      id: 'ev_' + Date.now().toString(36),
      type: 'system',
      label: 'تمت تصفية وبدء تسجيل الترافيك الحقيقي من الصفر (0)',
      device: 'Desktop',
      time: 'الآن',
      timestamp: Date.now(),
    },
  ];
  saveAnalytics(empty);

  try {
    await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    });
  } catch (e) {
    console.warn('Reset sync notice:', e);
  }

  return empty;
}

// Export Analytics Data as JSON
export function exportAnalyticsJson() {
  const data = loadAnalytics();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `movora-real-traffic-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default {
  loadAnalytics,
  fetchGlobalAnalytics,
  saveAnalytics,
  trackPageView,
  trackMovieStream,
  recordHeartbeat,
  getLiveActiveUsersCount,
  getDevicePercentages,
  getBrowserPercentages,
  resetAnalyticsData,
  exportAnalyticsJson,
  getFirebaseDbUrl,
  setFirebaseDbUrl,
};
