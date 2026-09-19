/**
 * SEO Manager for Movora Platform (movora.me)
 * Dynamically injects and manages metadata, OpenGraph tags, canonical links, and Schema.org JSON-LD
 */

const DEFAULT_TITLE = 'Movora | موفورا - منصة مشاهدة أحدث الأفلام والمسلسلات العربية والعالمية';
const DEFAULT_DESC = 'موفورا Movora (movora.me) - منصتك السينمائية الأولى لمشاهدة وتحميل أحدث الأفلام والمسلسلات العالمية المترجمة بجودة 1080p و 4K بدون إعلانات مزعجة وبسيرفرات فائقة السرعة.';
const DEFAULT_IMAGE = 'https://movora.me/favicon.svg';
const DEFAULT_URL = 'https://movora.me/';

function setMetaTag(selector, attribute, value) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    if (selector.startsWith('meta[name=')) {
      const name = selector.match(/meta\[name=([^]+)\]/)?.[1];
 if (name) element.setAttribute('name', name);
 } else if (selector.startsWith('meta[property=')) {
 const prop = selector.match(/meta\[property=([^]+)\]/)?.[1];
      if (prop) element.setAttribute('property', prop);
    }
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
}

function setCanonical(url) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel=canonical]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setSchemaJson(schemaObj) {
  if (typeof document === 'undefined') return;
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

  // Title
  document.title = title;

  // Standard Meta
  setMetaTag('meta[name=description]', 'content', description);
  setMetaTag('meta[name=keywords]', 'content', keywords);
  setCanonical(canonicalUrl);

  // Open Graph
  setMetaTag('meta[property=og:title]', 'content', title);
  setMetaTag('meta[property=og:description]', 'content', description);
  setMetaTag('meta[property=og:image]', 'content', ogImage);
  setMetaTag('meta[property=og:url]', 'content', canonicalUrl);
  setMetaTag('meta[property=og:type]', 'content', ogType);

  // Twitter Cards
  setMetaTag('meta[name=twitter:card]', 'content', 'summary_large_image');
  setMetaTag('meta[name=twitter:title]', 'content', title);
  setMetaTag('meta[name=twitter:description]', 'content', description);
  setMetaTag('meta[name=twitter:image]', 'content', ogImage);

  // Schema.org Structured Data
  if (schema) {
    setSchemaJson(schema);
  } else {
    setSchemaJson(null);
  }
}

export function resetPageSEO() {
  updatePageSEO({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    canonicalUrl: DEFAULT_URL,
    ogType: 'website',
    ogImage: DEFAULT_IMAGE,
    schema: null,
  });
}
