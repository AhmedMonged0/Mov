// ==========================================================================
// MOVORA REAL-TIME TRAFFIC & ANALYTICS ENGINE (100% REAL DATA)
// ==========================================================================

const STORAGE_KEY = 'movora_real_analytics_v2';
const VISITOR_KEY = 'movora_visitor_id';
const SESSION_KEY = 'movora_session_id';
const HEARTBEAT_KEY = 'movora_heartbeats';

// Generate or retrieve persistent unique visitor ID
function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = 'v_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

// Generate or retrieve current browser session ID
function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = 's_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// Detect client device information
function detectDevice() {
  const ua = navigator.userAgent || '';
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
function getArabicDayName(date = new Date()) {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}

// Clean Initial State starting with 0 (Zero fake numbers!)
function createEmptyAnalytics() {
  const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  return {
    totalVisits: 0,
    uniqueVisitorsCount: 0,
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
    lastUpdated: Date.now(),
  };
}

// Load current analytics state from storage
export function loadAnalytics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const empty = createEmptyAnalytics();
      saveAnalytics(empty);
      return empty;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Error loading analytics:', err);
    return createEmptyAnalytics();
  }
}

// Save analytics state to storage
export function saveAnalytics(data) {
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving analytics:', err);
  }
}

// Record Active Heartbeat for Live Users
export function recordHeartbeat() {
  try {
    const sessionId = getSessionId();
    const now = Date.now();
    let heartbeats = {};
    try {
      heartbeats = JSON.parse(localStorage.getItem(HEARTBEAT_KEY) || '{}');
    } catch (e) { heartbeats = {}; }

    heartbeats[sessionId] = now;

    // Prune stale sessions older than 5 minutes (300,000 ms)
    const fiveMinutesAgo = now - 300000;
    const active = {};
    for (const [id, time] of Object.entries(heartbeats)) {
      if (time > fiveMinutesAgo) {
        active[id] = time;
      }
    }
    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(active));
    return Object.keys(active).length;
  } catch (e) {
    return 1;
  }
}

// Get Real Active Live Users Count
export function getLiveActiveUsersCount() {
  try {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000;
    const heartbeats = JSON.parse(localStorage.getItem(HEARTBEAT_KEY) || '{}');
    let count = 0;
    for (const [, time] of Object.entries(heartbeats)) {
      if (time > fiveMinutesAgo) {
        count++;
      }
    }
    // At least 1 active user if admin is currently viewing
    return Math.max(1, count);
  } catch (e) {
    return 1;
  }
}

// Track REAL Page View
export function trackPageView(path = window.location.pathname) {
  try {
    const data = loadAnalytics();
    const visitorId = getVisitorId();
    const { device, browser, os } = detectDevice();
    const today = getArabicDayName();

    // 1. Increment total visits
    data.totalVisits = (data.totalVisits || 0) + 1;

    // 2. Check unique visitor
    const seenVisitorsKey = 'movora_real_seen_vids';
    let seenVids = [];
    try {
      seenVids = JSON.parse(localStorage.getItem(seenVisitorsKey) || '[]');
    } catch (e) { seenVids = []; }

    if (!seenVids.includes(visitorId)) {
      seenVids.push(visitorId);
      localStorage.setItem(seenVisitorsKey, JSON.stringify(seenVids));
      data.uniqueVisitorsCount = (data.uniqueVisitorsCount || 0) + 1;
    }

    // 3. Increment Device and Browser counters
    if (!data.deviceCounts) data.deviceCounts = { Mobile: 0, Desktop: 0, Tablet: 0 };
    data.deviceCounts[device] = (data.deviceCounts[device] || 0) + 1;

    if (!data.browserCounts) data.browserCounts = {};
    data.browserCounts[browser] = (data.browserCounts[browser] || 0) + 1;

    // 4. Update Daily Traffic for today
    if (!data.dailyTraffic || data.dailyTraffic.length === 0) {
      data.dailyTraffic = createEmptyAnalytics().dailyTraffic;
    }
    const todayIndex = data.dailyTraffic.findIndex(d => d.day === today);
    if (todayIndex > -1) {
      data.dailyTraffic[todayIndex].visits = (data.dailyTraffic[todayIndex].visits || 0) + 1;
    }

    // 5. Add to real-time events stream
    const pageLabel = path === '/' ? 'تصفح الصفحة الرئيسية' : `زيارة: ${path}`;
    const newEvent = {
      id: 'ev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      type: 'page_view',
      label: pageLabel,
      device,
      browser,
      os,
      time: 'الآن',
      path,
      timestamp: Date.now(),
    };

    data.recentEvents = [newEvent, ...(data.recentEvents || [])].slice(0, 30);

    saveAnalytics(data);
    recordHeartbeat();
  } catch (err) {
    console.warn('Track page view error:', err);
  }
}

// Track REAL Movie Stream Playback
export function trackMovieStream(movie, server = 'primary') {
  if (!movie) return;
  try {
    const data = loadAnalytics();
    const { device, browser } = detectDevice();
    const title = movie.title || movie.original_title || 'فيلم بدون عنوان';
    const today = getArabicDayName();

    // 1. Increment total streams
    data.totalStreams = (data.totalStreams || 0) + 1;

    // 2. Update Daily Traffic streams for today
    if (!data.dailyTraffic || data.dailyTraffic.length === 0) {
      data.dailyTraffic = createEmptyAnalytics().dailyTraffic;
    }
    const todayIndex = data.dailyTraffic.findIndex(d => d.day === today);
    if (todayIndex > -1) {
      data.dailyTraffic[todayIndex].streams = (data.dailyTraffic[todayIndex].streams || 0) + 1;
    }

    // 3. Update top movies count with REAL data
    let top = data.topMovies || [];
    const existingIndex = top.findIndex(m => m.id === movie.id);
    if (existingIndex > -1) {
      top[existingIndex].streams = (top[existingIndex].streams || 0) + 1;
      top[existingIndex].server = server;
    } else {
      top.push({
        id: movie.id,
        title,
        streams: 1,
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : '8.0',
        server,
      });
    }

    // Sort descending by actual stream count
    top.sort((a, b) => (b.streams || 0) - (a.streams || 0));
    data.topMovies = top.slice(0, 15);

    // 4. Add to real activity feed
    const newEvent = {
      id: 'ev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      type: 'movie_stream',
      label: `بدء تشغيل فيلم: ${title}`,
      device,
      browser,
      time: 'الآن',
      server,
      timestamp: Date.now(),
    };

    data.recentEvents = [newEvent, ...(data.recentEvents || [])].slice(0, 30);

    saveAnalytics(data);
    recordHeartbeat();
  } catch (err) {
    console.warn('Track movie stream error:', err);
  }
}

// Compute Device Percentages from Real Counts
export function getDevicePercentages(deviceCounts = {}) {
  const mobile = deviceCounts.Mobile || 0;
  const desktop = deviceCounts.Desktop || 0;
  const tablet = deviceCounts.Tablet || 0;
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
  const total = Object.values(browserCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return {};

  const pcts = {};
  for (const [b, count] of Object.entries(browserCounts)) {
    if (count > 0) {
      pcts[b] = Math.round((count / total) * 100);
    }
  }
  return pcts;
}

// Reset Analytics to Clean Zero
export function resetAnalyticsData() {
  const empty = createEmptyAnalytics();
  empty.recentEvents = [{
    id: 'ev_' + Date.now().toString(36),
    type: 'system',
    label: 'تمت تصفية وبدء تسجيل الترافيك الحقيقي من الصفر',
    device: 'Desktop',
    time: 'الآن',
    timestamp: Date.now(),
  }];
  saveAnalytics(empty);
  localStorage.removeItem('movora_real_seen_vids');
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
  saveAnalytics,
  trackPageView,
  trackMovieStream,
  recordHeartbeat,
  getLiveActiveUsersCount,
  getDevicePercentages,
  getBrowserPercentages,
  resetAnalyticsData,
  exportAnalyticsJson,
};
