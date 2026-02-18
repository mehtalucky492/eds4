import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
} from './aem.js';
import assetsInit from './aem-assets-plugin-support.js';

/**
 * Cache for site-wide settings fetched from homepage
 */
let siteSettingsCache = null;

/**
 * Homepage path for site-wide settings
 */
const HOMEPAGE_PATH = '/live-content/';

/**
 * Gets OneTrust domain script ID, first checking current page, then fetching from homepage.
 * @returns {Promise<string>} The OneTrust domain script ID, or empty string if not configured
 */
async function getOneTrustDomainScript() {
  // First, check if current page has the metadata
  const currentPageId = getMetadata('onetrust-domain-script');
  if (currentPageId) {
    return currentPageId;
  }

  // If we're on the homepage, no ID was found
  if (window.location.pathname === HOMEPAGE_PATH
      || window.location.pathname === `${HOMEPAGE_PATH}index.html`) {
    return '';
  }

  // Return cached value if available
  if (siteSettingsCache !== null) {
    return siteSettingsCache;
  }

  // Fetch homepage and extract the OneTrust ID
  try {
    const resp = await fetch(HOMEPAGE_PATH);
    if (resp.ok) {
      const html = await resp.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const homepageId = doc.querySelector('meta[name="onetrust-domain-script"]')?.content || '';
      siteSettingsCache = homepageId;
      return homepageId;
    }
  } catch (e) {
    // Silent fail - OneTrust will not load if homepage fetch fails
  }

  siteSettingsCache = '';
  return '';
}

/**
 * Loads OneTrust consent management script dynamically.
 * @param {string} domainScriptId The OneTrust domain script ID
 */
function loadOneTrust(domainScriptId) {
  if (!domainScriptId) {
    return;
  }

  // Check if OneTrust is already loaded
  if (document.querySelector('script[src*="otSDKStub.js"]')) {
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js';
  script.type = 'text/javascript';
  script.charset = 'UTF-8';
  script.setAttribute('data-domain-script', domainScriptId);
  script.async = true;
  document.head.appendChild(script);
}

/**
 * Detects if Universal Editor is active
 * @returns {boolean} true if UE is active
 */
export function isUniversalEditorActive() {
  return window.universalEditorActive
    || window.UniversalEditorEmbedded
    || (window.frames && window.frames[0] && window.frames[0].window
      && window.frames[0].window.UniversalEditorEmbedded)
    || document.body.classList.contains('ue-active')
    || document.documentElement.classList.contains('ue-active')
    || document.body.classList.contains('aue-active')
    || document.documentElement.classList.contains('aue-active')
    || window.location.pathname.includes('/editor.html/')
    || window.location.search.includes('editor=1')
    || !!document.querySelector('[data-aue-resource]');
}

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  if (window.hlx.aemassets?.decorateExternalImages) {
    window.hlx.aemassets.decorateExternalImages(main);
  }

  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();

  // Load OneTrust early (checks current page, then fetches from homepage if needed)
  getOneTrustDomainScript().then((onetrustId) => {
    loadOneTrust(onetrustId);
  });

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

function autolinkModals(doc) {
  doc.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');
    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  autolinkModals(doc);

  // Load header first before rest of page content
  await loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

/**
 * Custom functions
 */
export function getProps(block, config) {
  return Array.from(block.children).map((el, index) => {
    if (config?.picture) {
      return el.innerHTML.includes('picture') ? el.querySelector('picture') : el.innerText.trim();
    } if (config?.index && config?.index.includes(index)) {
      return el;
    }
    return el.innerHTML.includes('picture') ? el.querySelector('img').src.trim() : el.innerText.trim();
  });
}

await assetsInit(); // This to be done before loadPage() function invocation

// OneTrust button fix - run immediately when modal opens, not waiting for delayed.js
const fixOneTrustButtons = () => {
  const acceptBtn = document.getElementById('accept-recommended-btn-handler');
  const rejectBtn = document.getElementsByClassName('ot-pc-refuse-all-handler')[0];
  const container = document.getElementsByClassName('ot-btn-container')[0];

  if (acceptBtn && rejectBtn && container && acceptBtn.parentElement !== container) {
    container.prepend(acceptBtn, rejectBtn);
    acceptBtn.style.display = '';
    rejectBtn.style.display = '';
  }
};

// Watch for OneTrust modal to appear
const observeOneTrust = new MutationObserver(() => {
  const modal = document.getElementById('onetrust-pc-sdk');
  if (modal && modal.style.display !== 'none') {
    fixOneTrustButtons();
  }
});

if (document.body) {
  observeOneTrust.observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['style'],
  });
}

loadPage();

// Smooth scroll to ID
const OFFSET = 200; // positive value for header height

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return; // safety check

    e.preventDefault();

    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - OFFSET;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  });
});
