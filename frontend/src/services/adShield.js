// ==========================================================================
// MOVORA AD-SHIELD & MONETIZATION ENGINE
// 1. Blocks offensive 18+/adult popups and rogue redirects from third-party embed servers
// 2. Protects Admin Portal (/admin) so it remains 100% clean and ad-free
// ==========================================================================

import { API_ENDPOINT } from './analyticsTracker';

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

// Completely purge any floating or injected ads on Admin pages
export function purgeAdminAds() {
  if (typeof document === 'undefined') return;
  const selectors = [
    'script[src*="profitableratecpmnetwork.com"]',
    'script[src*="quge5.com"]',
    '#movora-monetag-script-tag',
    '#movora-monetag-meta-tag',
    '[class*="monetag"]',
    '[id*="monetag"]',
    '[class*="adsterra"]',
    '[id*="adsterra"]',
    '[class*="inpage_push"]',
    'div[style*="z-index: 2147483647"]',
    'div[style*="z-index: 999999"]',
    'div[style*="z-index: 100000"]'
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
}

// Apply settings directly to the DOM
export function applyAdSettings(settings) {
  if (typeof document === 'undefined') return;

  // Never show ads in admin dashboard or login page!
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    purgeAdminAds();
    return;
  }
}

// Active Anti-Adult Popup and Redirect Shield
export function initAdShield() {
  if (typeof window === 'undefined' || isShieldInitialized) return;
  isShieldInitialized = true;

  // If on admin route, purge immediately
  if (window.location.pathname.startsWith('/admin')) {
    purgeAdminAds();
  }

  // 1. Intercept rogue window.open calls from third-party players
  const originalWindowOpen = window.open;
  window.open = function (url, target, features) {
    const settings = getAdSettings();

    // Allow internal navigation or trusted routes
    if (!url || url.startsWith('/') || url.includes(window.location.host)) {
      return originalWindowOpen.call(window, url, target, features);
    }

    // If Anti-Adult Shield is active, block rogue third-party popup ads
    if (settings.antiAdultShield !== false) {
      console.warn('[Movora AdShield 🛡️] Blocked unwanted third-party ad popup:', url);
      return null;
    }

    return originalWindowOpen.call(window, url, target, features);
  };

  // 2. Prevent Top-Level Window Redirection Hijacking
  window.addEventListener('beforeunload', (e) => {
    // Only protect when user is on a viewing page or modal is open
    if (document.querySelector('.video-player-container') || document.querySelector('.video-modal-overlay')) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // 3. Load stored settings
  const localSettings = getAdSettings();
  applyAdSettings(localSettings);

  // 4. Unregister any legacy Monetag ServiceWorker
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
