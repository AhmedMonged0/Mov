import { put, get } from '@vercel/blob';

const BLOB_URL = 'https://gbawmvigpohlszyw.public.blob.vercel-storage.com/analytics/traffic.json';
const BLOB_PATH = 'analytics/traffic.json';

const DAYS_ORDER = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

function getArabicDayName(date = new Date()) {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}

function createEmptyAnalytics() {
  return {
    totalVisits: 0,
    uniqueVisitorsCount: 0,
    uniqueVisitorIds: [],
    totalStreams: 0,
    deviceCounts: { Mobile: 0, Desktop: 0, Tablet: 0 },
    browserCounts: { Chrome: 0, Safari: 0, Edge: 0, Firefox: 0, Opera: 0, Brave: 0 },
    dailyTraffic: DAYS_ORDER.map(day => ({ day, visits: 0, streams: 0 })),
    topMovies: [],
    recentEvents: [],
    activeSessions: {},
    liveActiveCount: 1,
    lastUpdated: Date.now()
  };
}

export default async function handler(req, res) {
  // 1. CORS Headers for universal client-side access
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Helper to fetch current analytics from Blob
  async function getCurrentData() {
    try {
      const blobRes = await get(BLOB_PATH, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
        access: 'public',
        headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' }
      });
      if (blobRes && blobRes.statusCode === 200 && blobRes.stream) {
        const text = await new Response(blobRes.stream).text();
        if (text) {
          const json = JSON.parse(text);
          if (json && typeof json === 'object') return json;
        }
      }
    } catch (e) {
      try {
        const response = await fetch(`${BLOB_URL}?t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache, no-store' }
        });
        if (response.ok) {
          const json = await response.json();
          if (json && typeof json === 'object') return json;
        }
      } catch (err) {}
    }
    return createEmptyAnalytics();
  }

  // 2. GET: Return current global data
  if (req.method === 'GET') {
    const data = await getCurrentData();
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json(data);
  }

  // 3. POST: Record event or update
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
      }
      body = body || {};

      const current = await getCurrentData();
      const now = Date.now();
      const today = getArabicDayName();

      const {
        action,
        path,
        movie,
        server,
        visitorId,
        sessionId,
        device = 'Desktop',
        browser = 'Chrome',
        os = 'Windows'
      } = body;

      // Handle Admin Reset
      if (action === 'reset') {
        const empty = createEmptyAnalytics();
        await put(BLOB_PATH, JSON.stringify(empty), {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,
          allowOverwrite: true
        });
        return res.status(200).json(empty);
      }

      // Handle Pageview
      if (action === 'pageview') {
        current.totalVisits = (Number(current.totalVisits) || 0) + 1;

        // Unique visitor tracking
        if (!Array.isArray(current.uniqueVisitorIds)) current.uniqueVisitorIds = [];
        if (visitorId && !current.uniqueVisitorIds.includes(visitorId)) {
          current.uniqueVisitorIds.push(visitorId);
          if (current.uniqueVisitorIds.length > 5000) {
            current.uniqueVisitorIds = current.uniqueVisitorIds.slice(-5000);
          }
        }
        current.uniqueVisitorsCount = Math.max(current.uniqueVisitorIds.length, 1);

        // Device & Browser counts
        if (!current.deviceCounts) current.deviceCounts = { Mobile: 0, Desktop: 0, Tablet: 0 };
        current.deviceCounts[device] = (Number(current.deviceCounts[device]) || 0) + 1;

        if (!current.browserCounts) current.browserCounts = {};
        current.browserCounts[browser] = (Number(current.browserCounts[browser]) || 0) + 1;

        // Daily traffic
        if (!Array.isArray(current.dailyTraffic) || current.dailyTraffic.length === 0) {
          current.dailyTraffic = DAYS_ORDER.map(d => ({ day: d, visits: 0, streams: 0 }));
        }
        const dayItem = current.dailyTraffic.find(d => d.day === today);
        if (dayItem) {
          dayItem.visits = (Number(dayItem.visits) || 0) + 1;
        }

        // Active Session
        if (sessionId) {
          if (!current.activeSessions) current.activeSessions = {};
          current.activeSessions[sessionId] = now;
        }

        // Recent Event
        const label = path === '/' ? 'تصفح الصفحة الرئيسية' : `زيارة: ${path || '/'}`;
        const newEvent = {
          id: 'ev_' + now.toString(36) + Math.random().toString(36).substring(2, 5),
          type: 'page_view',
          label,
          device,
          browser,
          os,
          time: 'الآن',
          path: path || '/',
          timestamp: now,
        };
        current.recentEvents = [newEvent, ...(Array.isArray(current.recentEvents) ? current.recentEvents : [])].slice(0, 30);
      }

      // Handle Stream Playback
      if (action === 'stream') {
        current.totalStreams = (Number(current.totalStreams) || 0) + 1;

        // Daily traffic streams
        if (Array.isArray(current.dailyTraffic)) {
          const dayItem = current.dailyTraffic.find(d => d.day === today);
          if (dayItem) {
            dayItem.streams = (Number(dayItem.streams) || 0) + 1;
          }
        }

        // Top movies
        if (movie && (movie.id || movie.title)) {
          const title = movie.title || movie.original_title || 'فيلم بدون عنوان';
          if (!Array.isArray(current.topMovies)) current.topMovies = [];
          const idx = current.topMovies.findIndex(m => String(m.id) === String(movie.id));
          if (idx > -1) {
            current.topMovies[idx].streams = (Number(current.topMovies[idx].streams) || 0) + 1;
            current.topMovies[idx].server = server || 'primary';
          } else {
            current.topMovies.push({
              id: movie.id,
              title,
              streams: 1,
              rating: movie.vote_average ? Number(movie.vote_average).toFixed(1) : '8.0',
              server: server || 'primary',
            });
          }
          current.topMovies.sort((a, b) => (b.streams || 0) - (a.streams || 0));
          current.topMovies = current.topMovies.slice(0, 20);
        }

        // Active Session
        if (sessionId) {
          if (!current.activeSessions) current.activeSessions = {};
          current.activeSessions[sessionId] = now;
        }

        // Recent Stream Event
        const title = movie ? (movie.title || movie.original_title || 'فيلم') : 'فيلم';
        const newEvent = {
          id: 'ev_' + now.toString(36) + Math.random().toString(36).substring(2, 5),
          type: 'movie_stream',
          label: `بدء تشغيل فيلم: ${title}`,
          device,
          browser,
          time: 'الآن',
          server: server || 'primary',
          timestamp: now,
        };
        current.recentEvents = [newEvent, ...(Array.isArray(current.recentEvents) ? current.recentEvents : [])].slice(0, 30);
      }

      // Prune active sessions (> 5 minutes inactive)
      let activeCount = 0;
      const pruned = {};
      if (current.activeSessions) {
        for (const [sId, time] of Object.entries(current.activeSessions)) {
          if (now - time < 300000) {
            pruned[sId] = time;
            activeCount++;
          }
        }
      }
      current.activeSessions = pruned;
      current.liveActiveCount = Math.max(activeCount, 1);
      current.lastUpdated = now;

      // Save back to Vercel Blob
      await put(BLOB_PATH, JSON.stringify(current), {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        allowOverwrite: true
      });

      return res.status(200).json(current);
    } catch (err) {
      console.error('Analytics API error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
