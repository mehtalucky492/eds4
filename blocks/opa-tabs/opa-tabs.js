import { isUniversalEditorActive } from '../../scripts/scripts.js';

function initTabAccordionLogic(block, tabsData) {
  // Grab the section to find accordions
  const section = block.closest('.section');
  if (!section) return;

  const accordions = section.querySelectorAll('.accordion[id]');
  if (!accordions.length) return;

  // Cache these so we're not querying the DOM constantly
  const tabLinks = block.querySelectorAll('.tabs__link');

  function activateTab(tabId) {
    // Style the active tab and update ARIA for screen readers
    tabLinks.forEach((link) => {
      const linkTabId = link.getAttribute('data-tab-id');
      if (linkTabId === tabId) {
        link.classList.add('tabs__link--active');
        link.setAttribute('aria-selected', 'true');
      } else {
        link.classList.remove('tabs__link--active');
        link.setAttribute('aria-selected', 'false');
      }
    });

    // Show the matching accordion, hide the rest
    accordions.forEach((accordion) => {
      const wrapper = accordion.closest('.opa-accordion-wrapper') || accordion.closest('.opa-accordion');
      if (!wrapper) return;
      if (accordion.id === tabId) {
        wrapper.style.display = '';
      } else {
        wrapper.style.display = 'none';
      }
    });
  }

  // Wire up click handlers for each tab
  tabLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab-id');
      // eslint-disable-next-line no-restricted-globals
      history.replaceState(null, '', `#${tabId}`); // Update URL hash without scrolling
      activateTab(tabId);
    });
  });

  // Listen for browser back/forward, but only add this listener once
  if (!block.dataset.hashListenerAdded) {
    block.dataset.hashListenerAdded = 'true';
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && tabsData.some((t) => t.id === hash)) {
        activateTab(hash);
      }
    });
  }

  // On load, activate the tab from URL hash or just use the first one
  const initialHash = window.location.hash.replace('#', '');
  const validTab = tabsData.find((t) => t.id === initialHash);
  const defaultTabId = validTab ? validTab.id : tabsData[0]?.id;

  if (defaultTabId) {
    activateTab(defaultTabId);
  }
}

export default function decorate(block) {
  const tabsData = [];

  // Transform each row into a tab link
  [...block.children].forEach((row) => {
    const cols = row.querySelectorAll(':scope > div');
    const link = cols[0]?.querySelector('a');
    const nameEl = cols[1]?.querySelector('p');

    const href = link?.getAttribute('href') || '';
    const id = href.replace('#', '');
    const name = nameEl?.textContent?.trim() || '';

    tabsData.push({ id, name, row });

    // Build the actual tab element with proper ARIA attributes
    const tabLink = document.createElement('a');
    tabLink.setAttribute('href', href);
    tabLink.className = 'tabs__link';
    tabLink.textContent = name;
    tabLink.setAttribute('data-tab-id', id);
    tabLink.setAttribute('role', 'tab');
    tabLink.setAttribute('aria-selected', 'false');
    tabLink.setAttribute('aria-controls', id);

    row.innerHTML = ''; // Clear out the original markup
    row.appendChild(tabLink);
  });

  // Bail out if we're in the Universal Editor
  if (isUniversalEditorActive()) return;

  // Wait for all accordion blocks to load before wiring up the tab logic
  const section = block.closest('.section');
  if (section) {
    const expectedCount = tabsData.length;

    const observer = new MutationObserver(() => {
      const accordions = section.querySelectorAll('.accordion[id]');
      // Once all accordions are in the DOM, we're good to go
      if (accordions.length >= expectedCount) {
        observer.disconnect();
        initTabAccordionLogic(block, tabsData);
      }
    });

    // Maybe they're already loaded? Check before setting up the observer
    const existingAccordions = section.querySelectorAll('.accordion[id]');
    if (existingAccordions.length >= expectedCount) {
      initTabAccordionLogic(block, tabsData);
    } else {
      observer.observe(section, { childList: true, subtree: true });
      // Safety net if the observer doesn't fire for some reason
      setTimeout(() => {
        observer.disconnect();
        initTabAccordionLogic(block, tabsData);
      }, 1000);
    }
  }
}
