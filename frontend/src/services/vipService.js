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

// 1-Click Activate 24-Hour Free Trial
export function activateFreeTrial() {
  if (typeof window === 'undefined') return { success: false };

  const now = Date.now();
  const durationMs = 24 * 60 * 60 * 1000; // 24 hours
  const current = getVipStatus();
  const baseTime = current.isVip ? current.expiresAt : now;
  const expiresAt = baseTime + durationMs;

  const membership = {
    isVip: true,
    code: 'FREE-TRIAL-24H',
    expiresAt,
    durationDays: 1,
    planName: 'تجربة VIP المجانية (24 ساعة)',
    isTrial: true,
    redeemedAt: now
  };

  localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(membership));
  localStorage.setItem('movora_trial_claimed', 'true');
  window.__MOVORA_IS_VIP = true;
  notifyVipChange();

  return {
    success: true,
    membership,
    message: 'تم تفعيل تجربتك المجانية لمدة 24 ساعة بنجاح! استمتع بمشاهدة بدون إعلانات نهائياً 🍿'
  };
}

// Add extra VIP hours to user account (from viral quests, wheel spin, etc.)
export function addVipHours(hours, reason = 'مكافأة تفاعلية') {
  if (typeof window === 'undefined') return { success: false };

  const now = Date.now();
  const current = getVipStatus();
  const msToAdd = Number(hours) * 60 * 60 * 1000;
  const baseTime = current.isVip ? current.expiresAt : now;
  const expiresAt = baseTime + msToAdd;

  const membership = {
    isVip: true,
    code: current.code || 'VIP-REWARD',
    expiresAt,
    durationDays: Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)),
    planName: current.planName || 'مكافأة Movora VIP',
    isTrial: current.isTrial ?? true,
    redeemedAt: current.redeemedAt || now
  };

  localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(membership));
  window.__MOVORA_IS_VIP = true;
  notifyVipChange();

  return { success: true, membership, hoursAdded: hours };
}

// Generate & retrieve unique user referral code
export function getReferralCode() {
  if (typeof window === 'undefined') return 'MOV-VIP';
  let code = localStorage.getItem('movora_my_ref_code');
  if (!code) {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `MOV-${rand}`;
    localStorage.setItem('movora_my_ref_code', code);
  }
  return code;
}

// Generate full referral sharing URL
export function getReferralLink() {
  const code = getReferralCode();
  return `https://movora.me/?ref=${code}`;
}

// Lucky Spin Wheel status & cooldown check (once every 24 hours)
export function getWheelStatus() {
  if (typeof window === 'undefined') return { canSpin: true, nextSpinInMs: 0 };
  const last = localStorage.getItem('movora_last_wheel_spin');
  if (!last) return { canSpin: true, nextSpinInMs: 0 };

  const diff = Date.now() - Number(last);
  const cooldown = 24 * 60 * 60 * 1000;
  if (diff >= cooldown) {
    return { canSpin: true, nextSpinInMs: 0 };
  }
  return { canSpin: false, nextSpinInMs: cooldown - diff };
}

// Record wheel spin reward
export function recordWheelSpin(hours) {
  if (typeof window === 'undefined') return { success: false };
  localStorage.setItem('movora_last_wheel_spin', String(Date.now()));
  return addVipHours(hours, 'عجلة الحظ اليومية');
}

// Completed Quests Manager (Telegram, WhatsApp, Bookmarks)
export function getCompletedQuests() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('movora_completed_quests') || '[]');
  } catch (e) {
    return [];
  }
}

export function claimQuestReward(questId, hours = 24) {
  if (typeof window === 'undefined') return { success: false };
  const completed = getCompletedQuests();
  if (completed.includes(questId)) {
    return { success: false, alreadyClaimed: true };
  }
  completed.push(questId);
  localStorage.setItem('movora_completed_quests', JSON.stringify(completed));
  addVipHours(hours, `مهمة ${questId}`);
  return { success: true, hours };
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
