// ==========================================================================
// MOVORA VIP MEMBERSHIP & PROMO CODE SERVICE
// Manages ad-free VIP memberships, promo code redemption, and admin code generation
// ==========================================================================

import { API_ENDPOINT, getVisitorId } from './analyticsTracker';

const VIP_STORAGE_KEY = 'movora_vip_membership_v1';
const VIP_CHANGE_EVENT = 'movora_vip_changed';

// Get current VIP status from local storage
export function getVipStatus() {
  if (typeof window === 'undefined') return { isVip: false };

  try {
    const raw = localStorage.getItem(VIP_STORAGE_KEY);
    if (!raw) return { isVip: false };

    const data = JSON.parse(raw);
    if (!data || !data.expiresAt) return { isVip: false };

    const now = Date.now();
    if (now > data.expiresAt) {
      // Membership expired
      return {
        isVip: false,
        isExpired: true,
        expiredAt: data.expiresAt,
        code: data.code,
        planName: data.planName
      };
    }

    const remainingMs = data.expiresAt - now;
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    return {
      isVip: true,
      code: data.code,
      expiresAt: data.expiresAt,
      durationDays: data.durationDays,
      planName: data.planName || 'عضوية مميزة',
      redeemedAt: data.redeemedAt,
      remainingDays: data.durationDays >= 9000 ? 9999 : remainingDays
    };
  } catch (err) {
    console.error('Error reading VIP status:', err);
    return { isVip: false };
  }
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
    notifyVipChange();
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
