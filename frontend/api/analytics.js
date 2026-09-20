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
    adSettings: {
      enabled: true,
      adNetwork: 'adsterra',
      bannerPlayerCode: '',
      antiAdultShield: true,
      lastUpdated: Date.now()
    },
    movieRequests: [],
    vipCodes: [],
    lastUpdated: Date.now()
  };
}

// Auto-heal data so visits, devices, and streams are always consistent
function autoHealAnalytics(data) {
  if (!data) return createEmptyAnalytics();

  const streams = Number(data.totalStreams) || 0;
  let visits = Number(data.totalVisits) || 0;

  // A stream is always a visit - visits must be at least equal to streams
  if (visits < streams) {
    visits = streams;
    data.totalVisits = visits;
  }

  // Ensure unique visitors is at least 1 if there were visits or streams
  if ((Number(data.uniqueVisitorsCount) || 0) < 1 && visits > 0) {
    data.uniqueVisitorsCount = 1;
    if (!data.uniqueVisitorIds || data.uniqueVisitorIds.length === 0) {
      data.uniqueVisitorIds = ['v_initial_user'];
    }
  }

  // Ensure device breakdown is credited if devices sum is 0 but visits > 0
  if (!data.deviceCounts) data.deviceCounts = { Mobile: 0, Desktop: 0, Tablet: 0 };
  const totalDev = (data.deviceCounts.Mobile || 0) + (data.deviceCounts.Desktop || 0) + (data.deviceCounts.Tablet || 0);
  if (totalDev === 0 && visits > 0) {
    const hasMobile = (data.recentEvents || []).some(e => e.device === 'Mobile');
    if (hasMobile) {
      data.deviceCounts.Mobile = visits;
    } else {
      data.deviceCounts.Desktop = visits;
    }
  }

  // Ensure browser breakdown is credited
  if (!data.browserCounts) data.browserCounts = {};
  const totalBrow = Object.values(data.browserCounts).reduce((a, b) => a + Number(b), 0);
  if (totalBrow === 0 && visits > 0) {
    const hasSafari = (data.recentEvents || []).some(e => e.browser === 'Safari');
    if (hasSafari) {
      data.browserCounts.Safari = visits;
    } else {
      data.browserCounts.Chrome = visits;
    }
  }

  // Fix daily traffic so visits are at least equal to streams for each day
  if (Array.isArray(data.dailyTraffic)) {
    data.dailyTraffic.forEach(dayItem => {
      const s = Number(dayItem.streams) || 0;
      const v = Number(dayItem.visits) || 0;
      if (v < s) dayItem.visits = s;
    });
  }

  // Ensure adSettings exists
  if (!data.adSettings) {
    data.adSettings = {
      enabled: true,
      adNetwork: 'adsterra',
      bannerPlayerCode: '',
      antiAdultShield: true,
      lastUpdated: Date.now()
    };
  }

  // Ensure movieRequests exists
  if (!Array.isArray(data.movieRequests)) {
    data.movieRequests = [];
  }

  // Ensure vipCodes exists
  if (!Array.isArray(data.vipCodes)) {
    data.vipCodes = [];
  }

  return data;
}

export default async function handler(req, res) {
  // 1. Universal CORS Headers
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

  // Helper to fetch current analytics from Blob (Always fresh, bypassing CDN cache)
  async function getCurrentData() {
    try {
      const response = await fetch(`${BLOB_URL}?t=${Date.now()}&_r=${Math.random()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      if (response.ok) {
        const json = await response.json();
        if (json && typeof json === 'object') return autoHealAnalytics(json);
      }
    } catch (err) {
      console.warn('Failed to fetch from primary blob url, fallback to get:', err.message);
      try {
        const blobRes = await get(BLOB_PATH, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
          access: 'public'
        });
        if (blobRes && blobRes.statusCode === 200 && blobRes.stream) {
          const text = await new Response(blobRes.stream).text();
          if (text) {
            const json = JSON.parse(text);
            if (json && typeof json === 'object') return autoHealAnalytics(json);
          }
        }
      } catch (e) {}
    }
    return createEmptyAnalytics();
  }

  // 2. GET: Return current global data
  if (req.method === 'GET') {
    const data = await getCurrentData();
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
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

      // Robust device detection (Client-provided or User-Agent fallback)
      const ua = (req.headers['user-agent'] || '').toLowerCase();
      let clientDevice = device;
      if (!clientDevice || clientDevice === 'Desktop') {
        if (/mobile|iphone|ipod|android|blackberry/i.test(ua)) clientDevice = 'Mobile';
        else if (/tablet|ipad/i.test(ua)) clientDevice = 'Tablet';
        else clientDevice = clientDevice || 'Desktop';
      }

      let clientBrowser = browser;
      if (!clientBrowser || clientBrowser === 'Chrome') {
        if (/safari/i.test(ua) && !/chrome/i.test(ua)) clientBrowser = 'Safari';
        else if (/firefox/i.test(ua)) clientBrowser = 'Firefox';
        else if (/edg/i.test(ua)) clientBrowser = 'Edge';
        else clientBrowser = clientBrowser || 'Chrome';
      }

      // Handle Admin Reset
      if (action === 'reset') {
        const empty = createEmptyAnalytics();
        await put(BLOB_PATH, JSON.stringify(empty), {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 0
        });
        return res.status(200).json(empty);
      }

      // Handle Ad Settings Update
      if (action === 'update_ads') {
        current.adSettings = {
          ...(current.adSettings || {}),
          ...(body.adSettings || {}),
          lastUpdated: now
        };
        await put(BLOB_PATH, JSON.stringify(current), {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 0
        });
        return res.status(200).json(current);
      }

      // Handle Visitor Movie Request Submission
      if (action === 'request_movie') {
        const title = (body.title || '').trim();
        if (title) {
          if (!Array.isArray(current.movieRequests)) current.movieRequests = [];
          const newRequest = {
            id: 'req_' + now.toString(36) + Math.random().toString(36).substring(2, 6),
            title,
            year: (body.year || '').trim(),
            notes: (body.notes || '').trim(),
            contact: (body.contact || '').trim(),
            status: 'pending', // 'pending' | 'fulfilled'
            createdAt: now,
            device: clientDevice,
            browser: clientBrowser
          };
          current.movieRequests.unshift(newRequest);
          if (current.movieRequests.length > 250) {
            current.movieRequests = current.movieRequests.slice(0, 250);
          }
          current.lastUpdated = now;

          await put(BLOB_PATH, JSON.stringify(current), {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false,
            allowOverwrite: true,
            cacheControlMaxAge: 0
          });
          return res.status(200).json({ success: true, request: newRequest, allRequests: current.movieRequests });
        }
        return res.status(400).json({ error: 'Movie title is required' });
      }

      // Handle Delete Movie Request
      if (action === 'delete_movie_request') {
        const reqId = body.requestId;
        if (reqId && Array.isArray(current.movieRequests)) {
          current.movieRequests = current.movieRequests.filter(r => r.id !== reqId);
          current.lastUpdated = now;

          await put(BLOB_PATH, JSON.stringify(current), {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false,
            allowOverwrite: true,
            cacheControlMaxAge: 0
          });
          return res.status(200).json({ success: true, movieRequests: current.movieRequests });
        }
        return res.status(400).json({ error: 'Request ID is required' });
      }

      // Handle Toggle Movie Request Status (Pending <-> Fulfilled)
      if (action === 'toggle_movie_request_status') {
        const reqId = body.requestId;
        if (reqId && Array.isArray(current.movieRequests)) {
          const target = current.movieRequests.find(r => r.id === reqId);
          if (target) {
            target.status = target.status === 'fulfilled' ? 'pending' : 'fulfilled';
            target.updatedAt = now;
            current.lastUpdated = now;

            await put(BLOB_PATH, JSON.stringify(current), {
              access: 'public',
              token: process.env.BLOB_READ_WRITE_TOKEN,
              addRandomSuffix: false,
              allowOverwrite: true,
              cacheControlMaxAge: 0
            });
            return res.status(200).json({ success: true, request: target, movieRequests: current.movieRequests });
          }
        }
        return res.status(404).json({ error: 'Request not found' });
      }

      // =============================================================
      // VIP PROMO CODES & AD-FREE MEMBERSHIP ACTIONS
      // =============================================================

      // 1. Get All VIP Codes (Admin)
      if (action === 'get_vip_codes') {
        return res.status(200).json({ success: true, vipCodes: current.vipCodes || [] });
      }

      // 2. Create New VIP Code (Admin)
      if (action === 'create_vip_code') {
        const rawCode = (body.code || '').trim().toUpperCase();
        if (!rawCode) {
          return res.status(400).json({ error: 'رمز الكود مطلوب' });
        }

        if (!Array.isArray(current.vipCodes)) current.vipCodes = [];

        // Check if code already exists
        const exists = current.vipCodes.some(c => c.code === rawCode);
        if (exists) {
          return res.status(400).json({ error: 'هذا الكود مسجل بالفعل، يرجى اختيار رمز آخر' });
        }

        const durationDays = Number(body.durationDays) || 30;
        const newVipCode = {
          id: 'vip_' + now.toString(36) + Math.random().toString(36).substring(2, 6),
          code: rawCode,
          durationDays,
          planName: body.planName || (durationDays >= 9000 ? 'مدى الحياة' : `${durationDays} يوم`),
          note: (body.note || '').trim(),
          status: 'active', // active, redeemed, cancelled
          createdAt: now,
          redeemedAt: null,
          redeemedBy: null,
          expiresAt: null
        };

        current.vipCodes.unshift(newVipCode);
        if (current.vipCodes.length > 500) {
          current.vipCodes = current.vipCodes.slice(0, 500);
        }
        current.lastUpdated = now;

        await put(BLOB_PATH, JSON.stringify(current), {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 0
        });

        return res.status(200).json({ success: true, code: newVipCode, vipCodes: current.vipCodes });
      }

      // 3. Redeem VIP Code (Visitor / Member)
      if (action === 'redeem_vip_code') {
        const codeInput = (body.code || '').trim().toUpperCase();
        if (!codeInput) {
          return res.status(400).json({ error: 'يرجى إدخال رمز كود الـ VIP' });
        }

        if (!Array.isArray(current.vipCodes)) current.vipCodes = [];

        const targetCode = current.vipCodes.find(c => c.code === codeInput);
        if (!targetCode) {
          return res.status(404).json({ error: 'كود غير صحيح، يرجى التأكد من كتابة الكود بشكل سليم' });
        }

        if (targetCode.status === 'redeemed') {
          return res.status(400).json({ error: 'هذا الكود تم استخدامه وتفعيله بالفعل من قبل' });
        }

        if (targetCode.status === 'cancelled') {
          return res.status(400).json({ error: 'هذا الكود تم إلغاؤه من قبل إدارة الموقع' });
        }

        // Calculate subscription expiry
        const durationDays = targetCode.durationDays || 30;
        const durationMs = durationDays >= 9000 
          ? (100 * 365 * 24 * 60 * 60 * 1000) // 100 years for lifetime
          : (durationDays * 24 * 60 * 60 * 1000);
        const expiresAt = now + durationMs;

        targetCode.status = 'redeemed';
        targetCode.redeemedAt = now;
        targetCode.redeemedBy = visitorId || sessionId || 'user_' + now.toString(36);
        targetCode.expiresAt = expiresAt;
        targetCode.updatedAt = now;
        current.lastUpdated = now;

        await put(BLOB_PATH, JSON.stringify(current), {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 0
        });

        return res.status(200).json({
          success: true,
          valid: true,
          code: targetCode.code,
          durationDays: targetCode.durationDays,
          planName: targetCode.planName,
          expiresAt
        });
      }

      // 4. Delete VIP Code (Admin)
      if (action === 'delete_vip_code') {
        const codeId = body.codeId;
        const codeStr = (body.code || '').trim().toUpperCase();
        if (codeId || codeStr) {
          if (!Array.isArray(current.vipCodes)) current.vipCodes = [];
          current.vipCodes = current.vipCodes.filter(c => {
            if (codeId && c.id === codeId) return false;
            if (codeStr && c.code && c.code.toUpperCase() === codeStr) return false;
            return true;
          });
          current.lastUpdated = now;

          await put(BLOB_PATH, JSON.stringify(current), {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false,
            allowOverwrite: true,
            cacheControlMaxAge: 0
          });
          return res.status(200).json({ success: true, vipCodes: current.vipCodes });
        }
        return res.status(400).json({ error: 'معرف الكود مطلوب' });
      }

      // 5. Verify VIP Membership Status (Client Heartbeat & Cancellation Sync)
      if (action === 'verify_vip_status') {
        const codeStr = (body.code || '').trim().toUpperCase();
        if (!codeStr) {
          return res.status(200).json({ valid: false, reason: 'no_code' });
        }
        if (!Array.isArray(current.vipCodes)) current.vipCodes = [];

        const target = current.vipCodes.find(c => c.code && c.code.toUpperCase() === codeStr);
        if (!target) {
          // The code was DELETED by admin -> revoke client VIP immediately!
          return res.status(200).json({ valid: false, reason: 'code_deleted' });
        }
        if (target.status === 'cancelled') {
          // The code was REVOKED by admin -> revoke client VIP immediately!
          return res.status(200).json({ valid: false, reason: 'code_cancelled' });
        }

        return res.status(200).json({
          valid: true,
          status: target.status,
          durationDays: target.durationDays,
          planName: target.planName,
          expiresAt: target.expiresAt
        });
      }

      // 6. Cancel / Revoke VIP Code (Admin)
      if (action === 'cancel_vip_code') {
        const codeId = body.codeId;
        const codeStr = (body.code || '').trim().toUpperCase();
        if (codeId || codeStr) {
          if (!Array.isArray(current.vipCodes)) current.vipCodes = [];
          const target = current.vipCodes.find(c => (codeId && c.id === codeId) || (codeStr && c.code && c.code.toUpperCase() === codeStr));
          if (target) {
            target.status = 'cancelled';
            target.updatedAt = now;
            current.lastUpdated = now;

            await put(BLOB_PATH, JSON.stringify(current), {
              access: 'public',
              token: process.env.BLOB_READ_WRITE_TOKEN,
              addRandomSuffix: false,
              allowOverwrite: true,
              cacheControlMaxAge: 0
            });
            return res.status(200).json({ success: true, vipCodes: current.vipCodes });
          }
        }
        return res.status(404).json({ error: 'الكود غير موجود' });
      }

      // -------------------------------------------------------------
      // UNIVERSAL TRACKING: Applies to BOTH Pageviews & Movie Streams
      // -------------------------------------------------------------

      // 1. Track Unique Visitor
      const vId = visitorId || sessionId || ('v_' + now.toString(36) + Math.random().toString(36).substring(2, 6));
      if (!Array.isArray(current.uniqueVisitorIds)) current.uniqueVisitorIds = [];
      if (!current.uniqueVisitorIds.includes(vId)) {
        current.uniqueVisitorIds.push(vId);
        if (current.uniqueVisitorIds.length > 5000) {
          current.uniqueVisitorIds = current.uniqueVisitorIds.slice(-5000);
        }
      }
      current.uniqueVisitorsCount = Math.max(current.uniqueVisitorIds.length, 1);

      // 2. Track Device Breakdown
      if (!current.deviceCounts) current.deviceCounts = { Mobile: 0, Desktop: 0, Tablet: 0 };
      current.deviceCounts[clientDevice] = (Number(current.deviceCounts[clientDevice]) || 0) + 1;

      // 3. Track Browser Breakdown
      if (!current.browserCounts) current.browserCounts = {};
      current.browserCounts[clientBrowser] = (Number(current.browserCounts[clientBrowser]) || 0) + 1;

      // 4. Ensure Daily Traffic Structure exists
      if (!Array.isArray(current.dailyTraffic) || current.dailyTraffic.length === 0) {
        current.dailyTraffic = DAYS_ORDER.map(d => ({ day: d, visits: 0, streams: 0 }));
      }
      const dayItem = current.dailyTraffic.find(d => d.day === today);

      // 5. Action Specific Logic: Pageview
      if (action === 'pageview') {
        current.totalVisits = (Number(current.totalVisits) || 0) + 1;
        if (dayItem) {
          dayItem.visits = (Number(dayItem.visits) || 0) + 1;
        }

        const label = path === '/' ? 'تصفح الصفحة الرئيسية' : `زيارة: ${path || '/'}`;
        const newEvent = {
          id: 'ev_' + now.toString(36) + Math.random().toString(36).substring(2, 5),
          type: 'page_view',
          label,
          device: clientDevice,
          browser: clientBrowser,
          os,
          time: 'الآن',
          path: path || '/',
          timestamp: now,
        };
        current.recentEvents = [newEvent, ...(Array.isArray(current.recentEvents) ? current.recentEvents : [])].slice(0, 30);
      }

      // 6. Action Specific Logic: Movie Stream
      if (action === 'stream') {
        current.totalStreams = (Number(current.totalStreams) || 0) + 1;
        // A stream is always a visit as well!
        current.totalVisits = Math.max((Number(current.totalVisits) || 0) + 1, current.totalStreams);

        if (dayItem) {
          dayItem.streams = (Number(dayItem.streams) || 0) + 1;
          dayItem.visits = Math.max((Number(dayItem.visits) || 0) + 1, dayItem.streams);
        }

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

        const title = movie ? (movie.title || movie.original_title || 'فيلم') : 'فيلم';
        const newEvent = {
          id: 'ev_' + now.toString(36) + Math.random().toString(36).substring(2, 5),
          type: 'movie_stream',
          label: `بدء تشغيل فيلم: ${title}`,
          device: clientDevice,
          browser: clientBrowser,
          time: 'الآن',
          server: server || 'primary',
          timestamp: now,
        };
        current.recentEvents = [newEvent, ...(Array.isArray(current.recentEvents) ? current.recentEvents : [])].slice(0, 30);
      }

      // 7. Active Session Heartbeat
      if (sessionId) {
        if (!current.activeSessions) current.activeSessions = {};
        current.activeSessions[sessionId] = now;
      }

      // Prune active sessions older than 5 minutes
      let activeCount = 0;
      const pruned = {};
      if (current.activeSessions) {
        for (const [sId, time] of Object.entries(current.activeSessions)) {
          if (now - Number(time) < 300000) {
            pruned[sId] = time;
            activeCount++;
          }
        }
      }
      current.activeSessions = pruned;
      current.liveActiveCount = Math.max(activeCount, 1);
      current.lastUpdated = now;

      // Auto-heal before write
      const finalData = autoHealAnalytics(current);

      // Save back to Vercel Blob
      await put(BLOB_PATH, JSON.stringify(finalData), {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 0
      });

      return res.status(200).json(finalData);
    } catch (err) {
      console.error('Analytics API error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
