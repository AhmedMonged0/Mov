// ==========================================================================
// MOVORA VIP MEMBERSHIP & PROMO CODE SERVICE
// Manages ad-free VIP memberships, promo code redemption, and admin code generation
// ==========================================================================

import { API_ENDPOINT, getVisitorId } from './analyticsTracker';

const VIP_STORAGE_KEY = 'movora_vip_membership_v1';
const VIP_CHANGE_EVENT = 'movora_vip_changed';

// Get current VIP status from local storage
export function getVipStatus() {
  if (typeof window === 'undefined') return { isVip: false, hasClaimedTrial: false };

  try {
    const raw = localStorage.getItem(VIP_STORAGE_KEY);
    const hasClaimedTrial = localStorage.getItem('movora_trial_claimed') === 'true';

    if (!raw) return { isVip: false, hasClaimedTrial };

    const data = JSON.parse(raw);
    if (!data || !data.expiresAt) return { isVip: false, hasClaimedTrial };

    const now = Date.now();
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

const GIFT_TRACKER_KEY = 'movora_welcome_gift_tracker_v2';
const GIFT_CHANGE_EVENT = 'movora_gift_changed';

// Get or initialize Welcome Gift Tracker (after 24h / 1 day, user unlocks 12h VIP free)
export function getWelcomeGiftTracker() {
  if (typeof window === 'undefined') return { status: 'hidden' };

  try {
    const now = Date.now();
    const raw = localStorage.getItem(GIFT_TRACKER_KEY);
    let tracker = null;

    if (!raw) {
      // First visit: initialize 24h countdown to unlock 12h VIP
      tracker = {
        firstSeen: now,
        unlockAt: now + 24 * 60 * 60 * 1000, // 24 hours (1 day)
        status: 'waiting', // 'waiting' | 'ready' | 'active' | 'expired'
        activeUntil: null,
        dismissed: false
      };
      localStorage.setItem(GIFT_TRACKER_KEY, JSON.stringify(tracker));
    } else {
      tracker = JSON.parse(raw);
    }

    if (!tracker) return { status: 'hidden' };

    // Update status based on current time
    if (tracker.status === 'waiting' && now >= tracker.unlockAt) {
      tracker.status = 'ready';
      localStorage.setItem(GIFT_TRACKER_KEY, JSON.stringify(tracker));
    } else if (tracker.status === 'active' && tracker.activeUntil && now >= tracker.activeUntil) {
      tracker.status = 'expired';
      localStorage.setItem(GIFT_TRACKER_KEY, JSON.stringify(tracker));
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

// Claim the 12-Hour VIP Gift
export function claim12HourGift() {
  if (typeof window === 'undefined') return { success: false };

  const now = Date.now();
  const durationMs = 12 * 60 * 60 * 1000; // 12 hours VIP
  const activeUntil = now + durationMs;

  const tracker = getWelcomeGiftTracker();
  tracker.status = 'active';
  tracker.activeUntil = activeUntil;
  tracker.claimedAt = now;
  localStorage.setItem(GIFT_TRACKER_KEY, JSON.stringify(tracker));

  const membership = {
    isVip: true,
    code: 'GIFT-12H-WELCOME',
    expiresAt: activeUntil,
    durationDays: 1,
    planName: 'هدية ترحيبية (12 ساعة VIP)',
    isTrial: true,
    redeemedAt: now
  };

  localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(membership));
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
  localStorage.setItem(GIFT_TRACKER_KEY, JSON.stringify(tracker));
  notifyGiftChange();
}

export function restoreGiftBar() {
  if (typeof window === 'undefined') return;
  const tracker = getWelcomeGiftTracker();
  tracker.dismissed = false;
  localStorage.setItem(GIFT_TRACKER_KEY, JSON.stringify(tracker));
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

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify_vip_status',
        code: current.code
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.valid) {
        console.warn('[Movora VIP] Subscription revoked or deleted by admin:', data.reason);
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

    // Save membership locally
    const membership = {
      isVip: true,
      code: cleanCode,
      expiresAt: data.expiresAt,
      durationDays: data.durationDays,
      planName: data.planName,
      redeemedAt: Date.now()
    };

    localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(membership));
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
