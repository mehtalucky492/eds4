import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Add "Go Back" link to submenus
 * @param {Element} submenu The submenu element
 * @param {number} level The depth level of the submenu
 */
function addGoBackLink(submenu, level) {
  const goBackItem = document.createElement('li');
  goBackItem.className = `main-menu__item main-menu__item--sub main-menu__item--sub-${level}`;
  
  const goBackLink = document.createElement('span');
  goBackLink.className = `go-back-sub-menu-link main-menu__link main-menu__link--sub main-menu__link--sub-${level}`;
  goBackLink.textContent = 'Go Back';
  goBackLink.setAttribute('tabindex', '0');
  
  goBackItem.appendChild(goBackLink);
  submenu.insertBefore(goBackItem, submenu.firstChild);
  
  goBackLink.addEventListener('click', () => {
    const parentLi = submenu.closest('li.main-menu__item--with-sub');
    if (parentLi) {
      parentLi.classList.remove('active');
      // Also close the submenu
      submenu.classList.remove('main-menu--sub-open');
      // Toggle expand-sub icon
      const expandSub = parentLi.querySelector(':scope > .expand-sub');
      if (expandSub) {
        expandSub.classList.remove('expand-sub--open');
      }
    }
  });
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const mainMenu = nav.querySelector('.main-nav');
    const expandedItems = mainMenu.querySelectorAll('.main-menu__item--with-sub.active');
    
    if (expandedItems.length > 0 && isDesktop.matches) {
      expandedItems.forEach((item) => item.classList.remove('active'));
      expandedItems[0].focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, mainMenu);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const mainMenu = nav.querySelector('.main-nav');
    const expandedItems = mainMenu.querySelectorAll('.main-menu__item--with-sub.active');
    
    if (expandedItems.length > 0 && isDesktop.matches) {
      expandedItems.forEach((item) => item.classList.remove('active'));
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, mainMenu, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isMenuWithSub = focused.classList.contains('main-menu__link--with-sub');
  if (isMenuWithSub && (e.code === 'Enter' || e.code === 'Space')) {
    e.preventDefault();
    const parentLi = focused.closest('li');
    const isActive = parentLi.classList.contains('active');
    
    // Close all other submenus at the same level
    const parentUl = parentLi.parentElement;
    parentUl.querySelectorAll(':scope > li.main-menu__item--with-sub.active').forEach((item) => {
      if (item !== parentLi) item.classList.remove('active');
    });
    
    parentLi.classList.toggle('active', !isActive);
  }
}

function focusMenuItem() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles submenu visibility
 * @param {Element} menuItem The menu item with submenu
 */
function toggleSubmenu(menuItem) {
  const isActive = menuItem.classList.contains('active');
  const submenu = menuItem.querySelector(':scope > .main-menu--sub');
  
  // Close all other submenus at the same level
  const parentUl = menuItem.parentElement;
  parentUl.querySelectorAll(':scope > li.main-menu__item--with-sub.active').forEach((item) => {
    if (item !== menuItem) {
      item.classList.remove('active');
      const otherSubmenu = item.querySelector(':scope > .main-menu--sub');
      if (otherSubmenu) {
        otherSubmenu.classList.remove('main-menu--sub-open');
      }
    }
  });
  
  // Toggle the current menu item
  menuItem.classList.toggle('active', !isActive);
  
  // Toggle submenu open class
  if (submenu) {
    submenu.classList.toggle('main-menu--sub-open', !isActive);
  }
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} mainNav The main nav menu within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, mainNav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = document.getElementById('toggle-expand');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  
  // Toggle all submenu items
  mainNav.querySelectorAll('.main-menu__item--with-sub').forEach((item) => {
    if (!isDesktop.matches && expanded) {
      item.classList.remove('active');
    }
  });
  
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  
  // Enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  
  // Create container and region structure
  const container = document.createElement('div');
  container.className = 'container';
  
  const region = document.createElement('div');
  region.className = 'region region-header-top clearfix';
  
  // Process fragment sections - look for .section divs or direct children
  const sections = fragment.querySelectorAll(':scope > div.section, :scope > div');
  
  // Find the brand section (logo)
  let brandSection = null;
  let menuSection = null;
  
  sections.forEach((section) => {
    if (section.classList.contains('nav-brand') || section.querySelector('picture, img')) {
      brandSection = section;
    } else if (section.classList.contains('nav-sections') || section.querySelector('ul')) {
      menuSection = section;
    }
  });
  
  // First section: Site Branding (Logo)
  if (brandSection) {
    const siteBranding = document.createElement('div');
    siteBranding.id = 'block-sitebranding-2';
    siteBranding.className = 'block';
    siteBranding.setAttribute('data-block-plugin-id', 'system_branding_block');
    
    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.rel = 'home';
    logoLink.className = 'site-logo';
    
    // Look for picture or img in the brand section
    const logoImg = brandSection.querySelector('picture') || brandSection.querySelector('img');
    if (logoImg) {
      if (logoImg.tagName === 'IMG') {
        // If it's just an img, wrap it in the structure
        logoLink.appendChild(logoImg.cloneNode(true));
      } else {
        // If it's a picture element, clone it
        logoLink.appendChild(logoImg.cloneNode(true));
      }
    }
    
    siteBranding.appendChild(logoLink);
    region.appendChild(siteBranding);
  }
  
  // Second section: Navigation Menu
  if (menuSection) {
    const nav = document.createElement('nav');
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-labelledby', 'block-mainmenu-menu');
    nav.id = 'block-mainmenu';
    nav.className = 'navigation';
    nav.setAttribute('data-block-plugin-id', 'system_menu_block:main-menu');
    
    const navTitle = document.createElement('h2');
    navTitle.className = 'navigation__title';
    navTitle.textContent = 'Main menu';
    nav.appendChild(navTitle);
    
    const navWrapper = document.createElement('div');
    
    // Create toggle expand button
    const toggleExpand = document.createElement('a');
    toggleExpand.href = '#';
    toggleExpand.id = 'toggle-expand';
    toggleExpand.className = 'toggle-expand';
    toggleExpand.innerHTML = `
      <span class="toggle-expand__open">
        <span class="toggle-expand__text"></span>
      </span>
      <span class="toggle-expand__close">
        <span class="toggle-expand__text"></span>
      </span>
    `;
    navWrapper.appendChild(toggleExpand);
    
    // Create main nav container
    const mainNav = document.createElement('div');
    mainNav.id = 'main-nav';
    mainNav.className = 'main-nav';
    
    // Convert the section's ul to main-menu - look deeper in the structure
    const originalUl = menuSection.querySelector('ul');
    if (originalUl) {
      const mainMenu = convertToMainMenu(originalUl, 0);
      mainNav.appendChild(mainMenu);
    }
    
    navWrapper.appendChild(mainNav);
    nav.appendChild(navWrapper);
    
    // Add toggle functionality
    toggleExpand.addEventListener('click', (e) => {
      e.preventDefault();
      const navElement = document.getElementById('block-mainmenu');
      toggleMenu(navElement, mainNav);
    });
    
    region.appendChild(nav);
  }
  
  container.appendChild(region);
  
  // Add middle header section (empty for now, matching site-head.html)
  const headerMiddle = document.createElement('div');
  headerMiddle.className = 'flexible-header__b header-middle';
  container.appendChild(headerMiddle);
  
  block.append(container);
  
  // Set initial state
  const navElement = document.getElementById('block-mainmenu');
  if (navElement) {
    navElement.setAttribute('aria-expanded', 'false');
    const mainNav = navElement.querySelector('.main-nav');
    // Prevent mobile nav behavior on window resize
    toggleMenu(navElement, mainNav, isDesktop.matches);
    isDesktop.addEventListener('change', () => toggleMenu(navElement, mainNav, isDesktop.matches));
  }
}

/**
 * Converts standard ul/li structure to main-menu structure
 * @param {Element} ul The ul element to convert
 * @param {number} level The nesting level (0 for top level)
 * @returns {Element} The converted menu element
 */
function convertToMainMenu(ul, level = 0) {
  const menu = document.createElement('ul');
  menu.className = level === 0 ? 'main-menu' : `main-menu main-menu--sub main-menu--sub-${level}`;
  
  const items = ul.querySelectorAll(':scope > li');
  
  items.forEach((item) => {
    const menuItem = document.createElement('li');
    const hasSubmenu = item.querySelector(':scope > ul');
    
    if (level === 0) {
      menuItem.className = hasSubmenu 
        ? 'main-menu__item main-menu__item--with-sub' 
        : 'main-menu__item';
    } else {
      menuItem.className = hasSubmenu
        ? `main-menu__item main-menu__item--sub main-menu__item--sub-${level} main-menu__item--with-sub`
        : `main-menu__item main-menu__item--sub main-menu__item--sub-${level}`;
    }
    
    // Get the text/link content - look for direct p, a, or button-container
    let content = item.querySelector(':scope > p:not(.button-container)');
    if (!content) {
      content = item.querySelector(':scope > p.button-container');
    }
    if (!content) {
      content = item.querySelector(':scope > a');
    }
    
    let menuLink;
    
    if (content) {
      // Check if there's an anchor inside
      const anchor = content.querySelector('a') || (content.tagName === 'A' ? content : null);
      
      if (anchor && !hasSubmenu) {
        // Regular link item
        menuLink = document.createElement('a');
        menuLink.href = anchor.href;
        menuLink.title = anchor.title || anchor.textContent.trim();
        menuLink.textContent = anchor.textContent.trim();
        menuLink.className = level === 0 
          ? 'main-menu__link' 
          : `main-menu__link main-menu__link--sub main-menu__link--sub-${level}`;
        
        if (anchor.target) menuLink.target = anchor.target;
        
        // Add special classes based on link text
        const linkText = menuLink.textContent.toLowerCase();
        if (linkText.includes('patient')) menuLink.classList.add('apply-patients');
        if (linkText.includes('hcp')) menuLink.classList.add('apply-hcps');
        if (linkText.includes('form')) menuLink.classList.add('apply-forms');
        if (linkText.includes('facebook')) menuLink.classList.add('facebook-link');
        if (linkText.includes('linkedin')) menuLink.classList.add('linkedin-link');
        if (linkText.includes('call')) menuLink.classList.add('call-us-menu-link');
      } else {
        // Item with submenu or span
        const textContent = content.textContent.trim();
        menuLink = document.createElement('span');
        menuLink.textContent = textContent;
        menuLink.className = hasSubmenu
          ? (level === 0 
            ? 'main-menu__link main-menu__link--with-sub' 
            : `main-menu__link main-menu__link--sub main-menu__link--sub-${level} main-menu__link--with-sub`)
          : (level === 0 
            ? 'main-menu__link' 
            : `main-menu__link main-menu__link--sub main-menu__link--sub-${level}`);
        
        // Add special classes based on text content
        if (textContent.toLowerCase().includes('follow')) menuLink.classList.add('social-links');
        if (textContent.toLowerCase().includes('form')) menuLink.classList.add('apply-forms');
        
        if (hasSubmenu) {
          menuLink.setAttribute('tabindex', '0');
        }
      }
      
      menuItem.appendChild(menuLink);
      
      // Add expand icon for items with submenus
      if (hasSubmenu) {
        const expandSub = document.createElement('span');
        expandSub.className = 'expand-sub';
        menuItem.appendChild(expandSub);
        
        // Store reference to expandSub for use in event handlers
        const currentExpandSub = expandSub;
        const currentMenuItem = menuItem;
        
        // Add click handler for submenu toggle - works on both mobile and desktop at all levels
        menuLink.addEventListener('click', (e) => {
          // Always prevent default for spans, and for links with submenus
          if (menuLink.tagName === 'SPAN') {
            e.preventDefault();
            const wasActive = currentMenuItem.classList.contains('active');
            toggleSubmenu(currentMenuItem);
            // Toggle expand-sub class based on new state
            if (wasActive) {
              currentExpandSub.classList.remove('expand-sub--open');
            } else {
              currentExpandSub.classList.add('expand-sub--open');
            }
          }
        });
        
        expandSub.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const wasActive = currentMenuItem.classList.contains('active');
          toggleSubmenu(currentMenuItem);
          // Toggle expand-sub class based on new state
          if (wasActive) {
            currentExpandSub.classList.remove('expand-sub--open');
          } else {
            currentExpandSub.classList.add('expand-sub--open');
          }
        });
        
        // Add keyboard support
        menuLink.addEventListener('focus', focusMenuItem);
        
        // Process submenu
        const submenu = item.querySelector(':scope > ul');
        if (submenu) {
          const convertedSubmenu = convertToMainMenu(submenu, level + 1);
          
          // Add "Go Back" link
          addGoBackLink(convertedSubmenu, level + 1);
          
          menuItem.appendChild(convertedSubmenu);
        }
      }
    }
    
    menu.appendChild(menuItem);
  });
  
  return menu;
}
