/**
 * SEO Manager for Movora Platform (movora.me)
 * Dynamically injects and manages metadata, OpenGraph tags, canonical links, and Schema.org JSON-LD
 */

const DEFAULT_TITLE = 'Movora | موفورا - منصة مشاهدة أحدث الأفلام والمسلسلات العربية والعالمية';
const DEFAULT_DESC = 'موفورا Movora (movora.me) - منصتك السينمائية الأولى لمشاهدة وتحميل أحدث الأفلام والمسلسلات العالمية المترجمة بجودة 1080p و 4K بدون إعلانات مزعجة وبسيرفرات فائقة السرعة.';
const DEFAULT_IMAGE = 'https://movora.me/favicon.svg';
const DEFAULT_URL = 'https://movora.me/';

function setMetaTag(nameOrProperty, value, isProperty = false) {
  if (typeof document === 'undefined' || !value) return;
  try {
    const attr = isProperty ? 'property' : 'name';
    // Always quote the attribute value in CSS selector to prevent colons (e.g. og:title) from throwing SyntaxError
    let element = document.head.querySelector(`meta[${attr}="${nameOrProperty}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, nameOrProperty);
      document.head.appendChild(element);
    }
    element.setAttribute('content', String(value));
  } catch (err) {
    console.warn(`[SEO] Failed to set meta tag ${nameOrProperty}:`, err);
  }
}

function setCanonical(url) {
  if (typeof document === 'undefined' || !url) return;
  try {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', String(url));
  } catch (err) {
    console.warn('[SEO] Failed to set canonical URL:', err);
  }
}

function setSchemaJson(schemaObj) {
  if (typeof document === 'undefined') return;
  try {
    let script = document.getElementById('movora-page-schema');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'movora-page-schema');
      document.head.appendChild(script);
    }
    if (schemaObj) {
      script.textContent = JSON.stringify(schemaObj);
    } else {
      script.remove();
    }
  } catch (err) {
    console.warn('[SEO] Failed to set Schema JSON:', err);
  }
}

export function updatePageSEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  keywords = 'موفورا, movora, movora.me, أفلام, مسلسلات, افلام مترجمة, افلام 2025, افلام 2026, سينما',
  canonicalUrl = DEFAULT_URL,
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  schema = null,
} = {}) {
  if (typeof document === 'undefined') return;

  try {
    // Title
    if (title) {
      document.title = title;
    }

    // Standard Meta
    setMetaTag('description', description, false);
    setMetaTag('keywords', keywords, false);
    setCanonical(canonicalUrl);

    // Open Graph (property)
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:type', ogType, true);

    // Twitter Cards (name)
    setMetaTag('twitter:card', 'summary_large_image', false);
    setMetaTag('twitter:title', title, false);
    setMetaTag('twitter:description', description, false);
    setMetaTag('twitter:image', ogImage, false);

    // Schema.org Structured Data
    if (schema) {
      setSchemaJson(schema);
    } else {
      setSchemaJson(null);
    }
  } catch (err) {
    console.warn('[SEO] updatePageSEO error caught safely:', err);
  }
}

export function resetPageSEO() {
  try {
    updatePageSEO({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESC,
      canonicalUrl: DEFAULT_URL,
      ogType: 'website',
      ogImage: DEFAULT_IMAGE,
      schema: null,
    });
  } catch (err) {
    console.warn('[SEO] resetPageSEO error caught safely:', err);
  }
}
