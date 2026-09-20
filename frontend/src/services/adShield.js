// ==========================================================================
// MOVORA AD-SHIELD & MONETIZATION ENGINE
// 1. Blocks offensive 18+/adult popups and rogue redirects from third-party embed servers
// 2. Protects Admin Portal (/admin) so it remains 100% clean and ad-free
// ==========================================================================

import { API_ENDPOINT } from './analyticsTracker';
import { isVipActive, subscribeToVip } from './vipService';

const AD_SETTINGS_KEY = 'movora_ad_settings_v2';

// Default configuration
const DEFAULT_AD_SETTINGS = {
  enabled: true,
  adsterraPopunder: 'https://pl31428179.profitableratecpmnetwork.com/7b/e7/07/7be707785eeb9d7afdf4c116107210a2.js',
  adsterraSocialBar: 'https://pl31428180.profitableratecpmnetwork.com/21/44/13/2144131ce5f19fd744b8bbd57b85d8b4.js',
  bannerPlayerCode: '',
  antiAdultShield: true,
  lastUpdated: Date.now()
};

let currentAdSettings = { ...DEFAULT_AD_SETTINGS };
let isShieldInitialized = false;

// Extract clean content string if user enters raw string or full <meta> tag
export function extractVerificationCode(input) {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/content=["']([^"']+)["']/i);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed.replace(/<[^>]+>/g, '').trim();
}

// Get cached ad settings
export function getAdSettings() {
  try {
    const saved = localStorage.getItem(AD_SETTINGS_KEY);
    if (saved) {
      currentAdSettings = { ...DEFAULT_AD_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return currentAdSettings;
}

// Save ad settings locally & to cloud
export async function saveAdSettingsToCloud(newSettings) {
  const merged = {
    ...currentAdSettings,
    ...newSettings,
    lastUpdated: Date.now()
  };

  currentAdSettings = merged;
  try {
    localStorage.setItem(AD_SETTINGS_KEY, JSON.stringify(merged));
  } catch (e) {}

  // Apply immediately to current DOM
  applyAdSettings(merged);

  // Send to Cloud Blob
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_ads',
        adSettings: merged
      })
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, data: data.adSettings || merged };
    }
  } catch (err) {
    console.warn('[AdShield] Cloud sync notice:', err.message);
  }

  return { success: true, data: merged };
}

// Completely purge any floating or injected ads on Admin pages or for VIP users
export function purgeAdminAds() {
  if (typeof document === 'undefined') return;
  const selectors = [
    'script[src*="profitableratecpmnetwork.com"]',
    'script[src*="quge5.com"]',
    'iframe[src*="profitableratecpmnetwork.com"]',
    'iframe[src*="quge5.com"]',
    '#movora-monetag-script-tag',
    '#movora-monetag-meta-tag',
    '[class*="monetag"]',
    '[id*="monetag"]',
    '[class*="adsterra"]',
    '[id*="adsterra"]',
    '[class*="inpage_push"]',
    'div[style*="z-index: 2147483647"]',
    'div[style*="z-index: 999999"]',
    'div[style*="z-index: 100000"]',
    'div[style*="z-index: 9999"]'
  ];

  selectors.forEach((sel) => {
    try {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el.closest('#root')) {
          el.remove();
        }
      });
    } catch (e) {}
  });

  // Also remove any direct body children with high fixed position outside #root
  try {
    const children = document.body.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (child.id === 'root' || child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue;
      const computed = window.getComputedStyle(child);
      if (computed.position === 'fixed' || computed.position === 'absolute') {
        const z = parseInt(computed.zIndex, 10);
        if (z >= 9999) {
          child.remove();
        }
      }
    }
  } catch (e) {}
}

export const purgeAllAds = purgeAdminAds;

// Apply settings directly to the DOM
export function applyAdSettings(settings) {
  if (typeof document === 'undefined') return;

  // Never show ads in admin dashboard or login page!
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    purgeAdminAds();
    return;
  }

  // If user is a VIP Member or ads disabled globally, purge all ads!
  if (isVipActive() || (typeof window !== 'undefined' && window.__MOVORA_IS_VIP) || (settings && settings.enabled === false)) {
    purgeAdminAds();
    return;
  }
}

// Active Anti-Adult Popup and Redirect Shield
export function initAdShield() {
  if (typeof window === 'undefined' || isShieldInitialized) return;
  isShieldInitialized = true;

  const checkIsVip = () => isVipActive() || !!window.__MOVORA_IS_VIP;
  const checkIsAdmin = () => window.location.pathname.startsWith('/admin');

  // If on admin route or user is VIP, purge immediately
  if (checkIsAdmin() || checkIsVip()) {
    purgeAdminAds();
  }

  // Continuous background cleanup when VIP or on admin
  setInterval(() => {
    if (checkIsAdmin() || checkIsVip()) {
      purgeAdminAds();
    }
  }, 2500);

  // Subscribe to dynamic VIP state changes
  subscribeToVip((vipStatus) => {
    if (vipStatus.isVip) {
      purgeAdminAds();
    }
  });

  // 1. Intercept rogue window.open calls from third-party players or ad scripts
  const originalWindowOpen = window.open;
  window.open = function (url, target, features) {
    const settings = getAdSettings();
    const isVip = checkIsVip();
    const isAdmin = checkIsAdmin();

    // Allow internal navigation or trusted routes
    if (url && (url.startsWith('/') || url.includes(window.location.host))) {
      return originalWindowOpen.call(window, url, target, features);
    }

    // For VIP members or Admin, block ALL external popup windows unconditionally!
    if (isVip || isAdmin) {
      console.warn('[Movora AdShield 🛡️] Blocked external popup window for VIP/Admin:', url);
      return null;
    }

    // If Anti-Adult Shield is active, block rogue third-party popup ads
    if (settings.antiAdultShield !== false) {
      console.warn('[Movora AdShield 🛡️] Blocked unwanted third-party ad popup:', url);
      return null;
    }

    return originalWindowOpen.call(window, url, target, features);
  };

  // 2. Intercept rogue anchor clicks used by ad scripts to bypass window.open
  try {
    const originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      const isVip = checkIsVip();
      const isAdmin = checkIsAdmin();
      const href = this.href || '';

      if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        const isInternal = href.startsWith('/') || href.includes(window.location.host);
        if (!isInternal && (isVip || isAdmin)) {
          if (href.includes('profitableratecpmnetwork') || href.includes('quge5') || href.includes('adsterra') || this.target === '_blank') {
            console.warn('[Movora AdShield 🛡️] Blocked rogue anchor click ad for VIP/Admin:', href);
            return;
          }
        }
      }
      return originalAnchorClick.apply(this, arguments);
    };
  } catch (e) {}

  // 3. MutationObserver to immediately destroy any injected ad nodes for VIP or Admin
  try {
    const observer = new MutationObserver((mutations) => {
      if (!checkIsVip() && !checkIsAdmin()) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) { // Element node
            const el = node;
            const src = (el.src || el.getAttribute('src') || '').toLowerCase();
            if (src.includes('profitableratecpmnetwork') || src.includes('quge5') || src.includes('adsterra')) {
              el.remove();
              continue;
            }
            const cls = (el.className || '').toString().toLowerCase();
            const id = (el.id || '').toString().toLowerCase();
            if (cls.includes('adsterra') || id.includes('adsterra') || cls.includes('inpage_push')) {
              el.remove();
              continue;
            }
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}

  // 4. Prevent Top-Level Window Redirection Hijacking
  window.addEventListener('beforeunload', (e) => {
    // Only protect when user is on a viewing page or modal is open
    if (document.querySelector('.video-player-container') || document.querySelector('.video-modal-overlay')) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // 5. Load stored settings
  const localSettings = getAdSettings();
  applyAdSettings(localSettings);

  // 6. Unregister any legacy Monetag ServiceWorker
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister().catch(() => {});
        }
      }).catch(() => {});
    } catch (e) {}
  }
}
