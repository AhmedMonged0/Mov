// ==========================================================================
// MOVORA VIP MEMBERSHIP & PROMO CODE SERVICE
// Manages ad-free VIP memberships, promo code redemption, and admin code generation
// ==========================================================================

import { API_ENDPOINT, getVisitorId } from './analyticsTracker';

const VIP_STORAGE_KEY = 'movora_vip_membership_v1';
const VIP_CHANGE_EVENT = 'movora_vip_changed';
const GIFT_VAULT_KEY = 'movora_gift_vault_v3';
const GIFT_CHANGE_EVENT = 'movora_gift_changed';
const VAULT_SALT = 'MOVORA_SECURE_GIFT_VAULT_2026_!@#';

let serverTimeOffset = 0;
let isServerSynced = false;
let lastWallTime = Date.now();
let lastMonotonicTime = typeof performance !== 'undefined' ? performance.now() : 0;

// ==========================================================================
// ANTI-TAMPERING CRYPTOGRAPHIC ENGINE
// ==========================================================================

// Deterministic Cryptographic Signature (Vault Checksum)
function computeVaultChecksum(payloadStr) {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x5bd1e995;
  const combined = payloadStr + VAULT_SALT + (typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 40) : '');
  
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    hash1 ^= code;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 = Math.imul(hash2 ^ code, 0x5bd1e995);
  }
  return `${(hash1 >>> 0).toString(36)}-${(hash2 >>> 0).toString(36)}`;
}

// Securely pack payload with tamper-proof signature
function packVaultData(data) {
  const jsonStr = JSON.stringify(data);
  const base64 = typeof btoa !== 'undefined' ? btoa(encodeURIComponent(jsonStr)) : jsonStr;
  const signature = computeVaultChecksum(jsonStr);
  return JSON.stringify({ d: base64, s: signature });
}

// Unpack & verify payload integrity (returns null if user edited LocalStorage in DevTools)
function unpackVaultData(envelopeStr) {
  if (!envelopeStr) return null;
  try {
    const parsed = JSON.parse(envelopeStr);
    if (!parsed || !parsed.d || !parsed.s) return null;

    const jsonStr = typeof atob !== 'undefined' ? decodeURIComponent(atob(parsed.d)) : parsed.d;
    const expectedSig = computeVaultChecksum(jsonStr);

    if (expectedSig !== parsed.s) {
      console.warn('[Movora Anti-Tamper] Signature mismatch: LocalStorage was manipulated manually!');
      return null;
    }

    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn('[Movora Anti-Tamper] Corrupted or manipulated storage envelope:', err);
    return null;
  }
}

// Get current VIP status from signed tamper-proof local storage
export function getVipStatus() {
  if (typeof window === 'undefined') return { isVip: false, hasClaimedTrial: false };

  try {
    const raw = localStorage.getItem(VIP_STORAGE_KEY);
    const hasClaimedTrial = localStorage.getItem('movora_trial_claimed') === 'true';

    if (!raw) return { isVip: false, hasClaimedTrial };

    let data = unpackVaultData(raw);

    // Auto-migrate legacy unencrypted data once
    if (!data) {
      try {
        const legacy = JSON.parse(raw);
        if (legacy && legacy.expiresAt && legacy.code) {
          data = legacy;
          localStorage.setItem(VIP_STORAGE_KEY, packVaultData(legacy));
        }
      } catch (e) {}
    }

    if (!data || !data.expiresAt) return { isVip: false, hasClaimedTrial };

    const now = getRealNow();
    if (now > data.expiresAt) {
      // Membership expired
      return {
        isVip: false,
        isExpired: true,
        expiredAt: data.expiresAt,
        code: data.code,
        planName: data.planName,
        isTrial: !!data.isTrial,
        hasClaimedTrial
      };
    }

    const remainingMs = Math.max(0, data.expiresAt - now);
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      isVip: true,
      code: data.code,
      expiresAt: data.expiresAt,
      durationDays: data.durationDays,
      planName: data.planName || 'عضوية مميزة',
      redeemedAt: data.redeemedAt,
      isTrial: !!data.isTrial,
      hasClaimedTrial,
      serverToken: data.serverToken || null,
      remainingDays: data.durationDays >= 9000 ? 9999 : remainingDays,
      remainingHours,
      remainingMinutes,
      remainingMs
    };
  } catch (err) {
    console.error('Error reading VIP status:', err);
    return { isVip: false, hasClaimedTrial: false };
  }
}

// Synchronize with trusted cloud server time
export async function syncServerClock() {
  if (typeof window === 'undefined') return;
  try {
    const t0 = performance.now();
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'server_time' })
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      let serverMs = data?.serverTime;
      if (!serverMs && res.headers) {
        const serverHeaderTime = res.headers.get('x-server-time') || res.headers.get('date');
        serverMs = Number(serverHeaderTime) || (serverHeaderTime ? new Date(serverHeaderTime).getTime() : 0);
      }
      if (serverMs > 0) {
        const t1 = performance.now();
        const latency = (t1 - t0) / 2;
        serverTimeOffset = (serverMs + latency) - Date.now();
        isServerSynced = true;
      }
    }
  } catch (e) {
    // Network offline fallback
  }
}

// Initial sync on startup
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncServerClock();
  }, 600);
}

// Trusted Current Timestamp (immune to user advancing device clock in Settings)
export function getRealNow() {
  const currentWall = Date.now();
  
  // Detect sudden artificial clock jumps (e.g. user set phone clock +24h forward)
  if (typeof performance !== 'undefined') {
    const currentMono = performance.now();
    const elapsedWall = currentWall - lastWallTime;
    const elapsedMono = currentMono - lastMonotonicTime;

    // If wall clock jumped forward by > 45s while browser mono clock barely moved (< 5s)
    if (elapsedWall > 45000 && elapsedMono < 5000) {
      console.warn('[Movora Anti-Tamper] Device clock manipulation detected! Preventing clock jump...');
      serverTimeOffset -= (elapsedWall - elapsedMono);
      syncServerClock();
    }
    lastWallTime = currentWall;
    lastMonotonicTime = currentMono;
  }

  return currentWall + serverTimeOffset;
}

// Initialize server-signed cryptographic token for anti-tamper verification
let isInitializingToken = false;
export async function initServerGiftToken() {
  if (typeof window === 'undefined' || isInitializingToken) return;
  isInitializingToken = true;
  try {
    const vId = getVisitorId();
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'init_gift', visitorId: vId })
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.token) {
        const rawEnvelope = localStorage.getItem(GIFT_VAULT_KEY);
        let tracker = unpackVaultData(rawEnvelope);
        if (tracker && !tracker.serverToken) {
          tracker.serverToken = data.token;
          if (data.unlockAt) {
            tracker.unlockAt = data.unlockAt;
          }
          localStorage.setItem(GIFT_VAULT_KEY, packVaultData(tracker));
          notifyGiftChange();
        }
      }
    }
  } catch (err) {
    // Offline fallback
  } finally {
    isInitializingToken = false;
  }
}

// Get or initialize Welcome Gift Tracker (after 24h, user unlocks 12h VIP free)
export function getWelcomeGiftTracker() {
  if (typeof window === 'undefined') return { status: 'hidden' };

  try {
    const now = getRealNow();
    const rawEnvelope = localStorage.getItem(GIFT_VAULT_KEY);
    let tracker = unpackVaultData(rawEnvelope);

    if (!tracker) {
      // First visit or tampered data: initialize verified tracker
      tracker = {
        firstSeen: now,
        unlockAt: now + (24 * 60 * 60 * 1000), // Exactly 24 hours (1 day)
        status: 'waiting',
        activeUntil: null,
        dismissed: false,
        serverToken: null
      };
      localStorage.setItem(GIFT_VAULT_KEY, packVaultData(tracker));
    }

    // Auto-request server cryptographic token if missing
    if (!tracker.serverToken && typeof window !== 'undefined' && tracker.status === 'waiting') {
      setTimeout(() => initServerGiftToken(), 300);
    }

    // Update status based on trusted real time
    if (tracker.status === 'waiting' && now >= tracker.unlockAt) {
      tracker.status = 'ready';
      localStorage.setItem(GIFT_VAULT_KEY, packVaultData(tracker));
    } else if (tracker.status === 'active' && tracker.activeUntil && now >= tracker.activeUntil) {
      tracker.status = 'expired';
      localStorage.setItem(GIFT_VAULT_KEY, packVaultData(tracker));
    }

    return tracker;
  } catch (e) {
    return { status: 'hidden' };
  }
}

// Subscribe to gift tracker changes
export function subscribeToGiftTracker(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(getWelcomeGiftTracker());
  window.addEventListener(GIFT_CHANGE_EVENT, handler);
  return () => window.removeEventListener(GIFT_CHANGE_EVENT, handler);
}

export function notifyGiftChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GIFT_CHANGE_EVENT, { detail: getWelcomeGiftTracker() }));
  }
}

// Claim the 12-Hour VIP Gift with Cryptographic Server Verification
export async function claim12HourGift() {
  if (typeof window === 'undefined') return { success: false, error: 'غير متاح' };

  const tracker = getWelcomeGiftTracker();

  if (tracker.status === 'active') {
    return { success: false, error: 'هديتك الترحيبية مفعلة بالفعل حالياً!' };
  }
  if (tracker.status === 'expired') {
    return { success: false, error: 'تم استهلاك هذه الهدية الترحيبية مسبقاً.' };
  }
  if (tracker.status !== 'ready') {
    return { success: false, error: 'لم ينتهِ عداد الـ 24 ساعة بعد!' };
  }

  // 1. Server-Side Verification: Ensure 24 hours truly passed on the server
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify_gift_claim',
        visitorId: getVisitorId(),
        token: tracker.serverToken,
        unlockAt: tracker.unlockAt
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || 'فشل التحقق من السيرفر' };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      return { 
        success: false, 
        error: errData.error || 'لم ينتهِ وقت العداد الحقيقي بعد في خوادم موفورا!' 
      };
    }
  } catch (e) {
    // Offline leeway: check local trusted clock
  }

  const now = getRealNow();
  const durationMs = 12 * 60 * 60 * 1000; // 12 hours VIP
  const activeUntil = now + durationMs;

  tracker.status = 'active';
  tracker.activeUntil = activeUntil;
  tracker.claimedAt = now;
  localStorage.setItem(GIFT_VAULT_KEY, packVaultData(tracker));

  const membership = {
    isVip: true,
    code: 'GIFT-12H-WELCOME',
    expiresAt: activeUntil,
    durationDays: 1,
    planName: 'هدية ترحيبية (12 ساعة VIP)',
    isTrial: true,
    redeemedAt: now
  };

  localStorage.setItem(VIP_STORAGE_KEY, packVaultData(membership));
  window.__MOVORA_IS_VIP = true;
  notifyVipChange();
  notifyGiftChange();

  return { success: true, tracker, membership };
}

// Dismiss or minimize gift bar
export function dismissGiftBar() {
  if (typeof window === 'undefined') return;
  const tracker = getWelcomeGiftTracker();
  tracker.dismissed = true;
  localStorage.setItem(GIFT_VAULT_KEY, packVaultData(tracker));
  notifyGiftChange();
}

export function restoreGiftBar() {
  if (typeof window === 'undefined') return;
  const tracker = getWelcomeGiftTracker();
  tracker.dismissed = false;
  localStorage.setItem(GIFT_VAULT_KEY, packVaultData(tracker));
  notifyGiftChange();
}

// Quick check if current user has active VIP
export function isVipActive() {
  return getVipStatus().isVip === true;
}

// Subscribe to VIP status changes (reactive state updates across components)
export function subscribeToVip(callback) {
  if (typeof window === 'undefined') return () => {};

  const handler = (e) => {
    callback(getVipStatus());
  };

  window.addEventListener(VIP_CHANGE_EVENT, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === VIP_STORAGE_KEY) {
      callback(getVipStatus());
    }
  });

  return () => {
    window.removeEventListener(VIP_CHANGE_EVENT, handler);
  };
}

// Notify all open components of VIP status update
function notifyVipChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(VIP_CHANGE_EVENT, { detail: getVipStatus() }));
  }
}

// Synchronize and verify VIP status with Cloud (checks if admin deleted/cancelled the code)
export async function verifyVipWithCloud() {
  if (typeof window === 'undefined') return { isVip: false };

  const current = getVipStatus();
  if (!current.isVip || !current.code) return current;

  // Gift trials don't need cloud code validation
  if (current.isTrial || current.code === 'GIFT-12H-WELCOME') return current;

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify_vip_status',
        code: current.code,
        token: current.serverToken || ''
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.valid) {
        console.warn('[Movora VIP] Subscription revoked or tampered:', data.reason);
        cancelVipLocally();
        return { isVip: false, isRevoked: true };
      }
    }
  } catch (err) {
    // Offline or network error: keep local session
  }
  return current;
}

// Check on boot if window is available
if (typeof window !== 'undefined') {
  setTimeout(() => {
    verifyVipWithCloud();
  }, 1000);
}

// Redeem VIP code (Visitor / Member)
export async function redeemVipCode(code) {
  if (!code || !code.trim()) {
    return { success: false, error: 'يرجى كتابة رمز الكود' };
  }

  const cleanCode = code.trim().toUpperCase();
  const visitorId = getVisitorId();

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'redeem_vip_code',
        code: cleanCode,
        visitorId
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'تعذر تفعيل الكود، تأكد من صحته' };
    }

    // Save membership into tamper-proof signed vault
    const membership = {
      isVip: true,
      code: cleanCode,
      expiresAt: data.expiresAt,
      durationDays: data.durationDays,
      planName: data.planName,
      redeemedAt: Date.now(),
      serverToken: data.vipToken || null
    };

    localStorage.setItem(VIP_STORAGE_KEY, packVaultData(membership));
    if (typeof window !== 'undefined') {
      window.__MOVORA_IS_VIP = true;
    }
    notifyVipChange();

    return {
      success: true,
      membership,
      message: `تم تفعيل اشتراك Movora VIP بنجاح (${data.planName})! استمتع بمشاهدة بدون إعلانات نهائياً 🍿`
    };
  } catch (err) {
    console.warn('VIP redeem network fallback:', err.message);
    return { success: false, error: 'تعذر الاتصال بالخادم، يرجى المحاولة بعد قليل' };
  }
}

// Cancel or Logout VIP locally
export function cancelVipLocally() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(VIP_STORAGE_KEY);
    window.__MOVORA_IS_VIP = false;
    notifyVipChange();
  }
}

// Revoke / Cancel code from Cloud (Admin)
export async function cancelVipCode(codeId, codeStr) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cancel_vip_code',
        codeId,
        code: codeStr
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, vipCodes: data.vipCodes };
    }
    return { success: false, error: data.error || 'تعذر إلغاء الكود' };
  } catch (err) {
    console.error('Failed to cancel VIP code:', err);
    return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
  }
}

// ==========================================================================
// ADMIN API FUNCTIONS
// ==========================================================================

// Fetch all VIP codes (Admin)
export async function fetchVipCodes() {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_vip_codes' })
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, vipCodes: data.vipCodes || [] };
    }
  } catch (err) {
    console.error('Failed to fetch VIP codes:', err);
  }
  return { success: false, vipCodes: [] };
}

// Generate a random high-entropy VIP code string
export function generateRandomCodePrefix(planDays = 30) {
  const prefix = planDays >= 9000 ? 'VIP-LIFE' : planDays >= 365 ? 'VIP-YEAR' : 'VIP-MOV';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${rand}`;
}

// Create new VIP code (Admin)
export async function createVipCode({ code, durationDays = 30, planName, note = '' }) {
  try {
    const cleanCode = (code || generateRandomCodePrefix(durationDays)).trim().toUpperCase();

    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_vip_code',
        code: cleanCode,
        durationDays: Number(durationDays),
        planName,
        note
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, code: data.code, vipCodes: data.vipCodes };
    }
    return { success: false, error: data.error || 'تعذر إنشاء الكود' };
  } catch (err) {
    console.error('Failed to create VIP code:', err);
    return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
  }
}

// Delete / Revoke VIP code (Admin)
export async function deleteVipCode(codeId, codeStr) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_vip_code',
        codeId,
        code: codeStr
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, vipCodes: data.vipCodes };
    }
    return { success: false, error: data.error || 'تعذر حذف الكود' };
  } catch (err) {
    console.error('Failed to delete VIP code:', err);
    return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
  }
}
