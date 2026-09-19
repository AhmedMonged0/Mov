// ==========================================================================
// MOVORA AD-SHIELD & MONETAG INTEGRATION ENGINE
// 1. Blocks offensive 18+/adult popups and rogue redirects from third-party embed servers
// 2. Safely integrates Monetag monetization scripts (MultiTag, Push, Banners, Verification)
// ==========================================================================

import { API_ENDPOINT } from './analyticsTracker';

const AD_SETTINGS_KEY = 'movora_ad_settings_v1';
const MONETAG_SCRIPT_ID = 'movora-monetag-script-tag';
const MONETAG_META_ID = 'movora-monetag-meta-tag';

// Default configuration with active Monetag Multitag
const DEFAULT_AD_SETTINGS = {
  enabled: true,
  monetagVerification: '',
  monetagScript: '<script src="https://quge5.com/88/tag.min.js" data-zone="283157" async data-cfasync="false"></script>',
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
    '#movora-monetag-script-tag',
    '[class*="inpage_push"]',
    '[class*="monetag"]',
    '[id*="monetag"]',
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

  const { enabled, monetagVerification, monetagScript } = settings;

  // 1. Inject or update Monetag Domain Verification Meta Tag
  const cleanMetaCode = extractVerificationCode(monetagVerification);
  let metaTag = document.getElementById(MONETAG_META_ID);

  if (cleanMetaCode) {
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.id = MONETAG_META_ID;
      metaTag.name = 'monetag';
      document.head.appendChild(metaTag);
    }
    metaTag.content = cleanMetaCode;
  } else if (metaTag) {
    metaTag.remove();
  }

  // 2. Inject or remove Monetag Ad Script
  const existingContainer = document.getElementById(MONETAG_SCRIPT_ID);
  if (existingContainer) {
    existingContainer.remove();
  }

  if (enabled && monetagScript && monetagScript.trim()) {
    try {
      const container = document.createElement('div');
      container.id = MONETAG_SCRIPT_ID;
      container.style.display = 'none';

      // Parse script tags or inline JS
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = monetagScript;
      const scripts = tempDiv.getElementsByTagName('script');

      if (scripts.length > 0) {
        Array.from(scripts).forEach((oldScript) => {
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });
          if (oldScript.src) {
            newScript.src = oldScript.src;
          } else {
            newScript.textContent = oldScript.textContent;
          }
          container.appendChild(newScript);
        });
      } else {
        // Raw script content or URL
        const scriptEl = document.createElement('script');
        if (monetagScript.trim().startsWith('http')) {
          scriptEl.src = monetagScript.trim();
          scriptEl.async = true;
        } else {
          scriptEl.textContent = monetagScript;
        }
        container.appendChild(scriptEl);
      }

      document.body.appendChild(container);
    } catch (e) {
      console.error('[AdShield] Error injecting Monetag script:', e);
    }
  }
}

// Active Anti-Adult Popup and Redirect Shield
export function initAdShield() {
  if (typeof window === 'undefined' || isShieldInitialized) return;
  isShieldInitialized = true;

  // 1. Intercept rogue window.open calls from third-party players
  const originalWindowOpen = window.open;
  window.open = function (url, target, features) {
    const settings = getAdSettings();

    // If user's Monetag ad wants to open an approved ad window, allow it
    if (window.__allow_monetag_popup) {
      return originalWindowOpen.call(window, url, target, features);
    }

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
      // Browsers will ask user confirmation before redirecting to adult spam sites
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // 3. Load stored settings and fetch from cloud asynchronously
  const localSettings = getAdSettings();
  applyAdSettings(localSettings);

  fetch(`${API_ENDPOINT}?t=${Date.now()}`)
    .then((r) => r.json())
    .then((data) => {
      if (data && data.adSettings) {
        currentAdSettings = { ...DEFAULT_AD_SETTINGS, ...data.adSettings };
        try {
          localStorage.setItem(AD_SETTINGS_KEY, JSON.stringify(currentAdSettings));
        } catch (e) {}
        applyAdSettings(currentAdSettings);
      }
    })
    .catch(() => {});

  // 4. Register Monetag Service Worker for push monetization and verification
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[AdShield] Monetag ServiceWorker active with scope:', reg.scope);
        })
        .catch((err) => {
          console.log('[AdShield] SW registration notice:', err.message);
        });
    });
  }
}
