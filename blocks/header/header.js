import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 992px)');

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
      submenu.classList.remove('main-menu-sub-menu-opened');

      // Find the parent menu (could be main menu or a parent submenu)
      const grandParentSubmenu = parentLi.closest('.main-menu--sub');

      // Remove the class from the appropriate parent menu
      if (grandParentSubmenu) {
        // This is a nested submenu - remove class from parent submenu
        grandParentSubmenu.classList.remove('main-menu-sub-menu-open');
      } else {
        // This is a top-level submenu - remove class from main menu
        const mainMenu = document.querySelector('.main-menu');
        if (mainMenu) {
          mainMenu.classList.remove('main-menu-sub-menu-open');
        }
      }

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
    const nav = document.getElementById('block-mainmenu');
    if (!nav) return;

    const mainMenu = nav.querySelector('.main-nav');
    if (!mainMenu) return;

    const expandedItems = mainMenu.querySelectorAll('.main-menu__item--with-sub.active');

    if (expandedItems.length > 0 && isDesktop.matches) {
      expandedItems.forEach((item) => {
        item.classList.remove('active');
        const submenu = item.querySelector(':scope > .main-menu--sub');
        if (submenu) {
          submenu.classList.remove('main-menu--sub-open');
          submenu.classList.remove('main-menu-sub-menu-opened');
        }
        const expandSub = item.querySelector(':scope > .expand-sub');
        if (expandSub) {
          expandSub.classList.remove('expand-sub--open');
        }
      });
      if (expandedItems[0]) expandedItems[0].focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, mainMenu);
      const button = nav.querySelector('button');
      if (button) button.focus();
    }
  }
}

/**
 * Close all open submenus
 */
function closeAllSubmenus() {
  const nav = document.getElementById('block-mainmenu');
  if (!nav) return;

  const mainMenu = nav.querySelector('.main-nav');
  if (!mainMenu) return;

  // Get all expanded menu items (including nested ones)
  const expandedItems = mainMenu.querySelectorAll('.main-menu__item--with-sub.active');

  expandedItems.forEach((item) => {
    item.classList.remove('active');
    const submenu = item.querySelector(':scope > .main-menu--sub');
    if (submenu) {
      submenu.classList.remove('main-menu--sub-open');
      submenu.classList.remove('main-menu-sub-menu-opened');
    }
    // Reset expand-sub icons
    const expandSub = item.querySelector(':scope > .expand-sub');
    if (expandSub) {
      expandSub.classList.remove('expand-sub--open');
    }
  });

  // Reset any menu state classes
  const allSubmenus = mainMenu.querySelectorAll('.main-menu--sub');
  allSubmenus.forEach((submenu) => {
    submenu.classList.remove('main-menu-sub-menu-open');
  });

  const mainMenuUl = mainMenu.querySelector('.main-menu');
  if (mainMenuUl) {
    mainMenuUl.classList.remove('main-menu-sub-menu-open');
  }
}

/**
 * Close all submenus when clicking outside on desktop
 * @param {Event} e The click event
 */
function closeOnClickOutside(e) {
  if (!isDesktop.matches) return; // Only for desktop

  const nav = document.getElementById('block-mainmenu');
  if (!nav) return;

  // Check if click is outside the navigation
  if (!nav.contains(e.target)) {
    closeAllSubmenus();
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
 * Handle Tab key to open menus on focus
 */
function handleTabKey() {
  const menuLinks = document.querySelectorAll('.main-menu__link--with-sub');

  window.addEventListener('keyup', (e) => {
    // Tab key (keyCode 9)
    if (e.keyCode === 9 || e.which === 9 || e.code === 'Tab') {
      menuLinks.forEach((link) => {
        if (link === document.activeElement) {
          const parentLi = link.closest('li.main-menu__item--with-sub');
          const submenu = link.nextElementSibling;

          if (parentLi && submenu && submenu.classList.contains('main-menu--sub')) {
            const mainMenu = document.querySelector('.main-menu:not(.main-menu--sub)');

            // Add classes to show submenu on tab focus
            if (mainMenu) {
              mainMenu.classList.add('main-menu-sub-menu-open');
            }
            submenu.classList.add('main-menu-sub-menu-opened');
            parentLi.classList.add('active');
          }
        }
      });
    }
  });
}

/**
 * Toggles submenu visibility
 * @param {Element} menuItem The menu item with submenu
 */
function toggleSubmenu(menuItem) {
  const isActive = menuItem.classList.contains('active');
  const submenu = menuItem.querySelector(':scope > .main-menu--sub');

  // On desktop: Check if this is a TOP-LEVEL parent (not a child submenu item)
  if (isDesktop.matches) {
    // Check if this is a top-level menu item (not inside a submenu)
    const isTopLevel = !menuItem.closest('.main-menu--sub');

    if (isTopLevel) {
      // Top-level parent menu logic: two-click behavior
      const nav = document.getElementById('block-mainmenu');
      if (nav) {
        const mainMenu = nav.querySelector('.main-nav');
        if (mainMenu) {
          // Check if ANY top-level menu items are open
          const anyOpenTopLevelItems = mainMenu.querySelectorAll('.main-menu > .main-menu__item--with-sub.active');

          // If there are open top-level items and this item is not currently active
          if (anyOpenTopLevelItems.length > 0 && !isActive) {
            // Close ALL open menus first (including their children)
            anyOpenTopLevelItems.forEach((item) => {
              item.classList.remove('active');
              const openSubmenu = item.querySelector(':scope > .main-menu--sub');
              if (openSubmenu) {
                openSubmenu.classList.remove('main-menu--sub-open');
                openSubmenu.classList.remove('main-menu-sub-menu-opened');

                // Also close any nested submenus
                const nestedOpenItems = openSubmenu.querySelectorAll('.main-menu__item--with-sub.active');
                nestedOpenItems.forEach((nestedItem) => {
                  nestedItem.classList.remove('active');
                  const nestedSubmenu = nestedItem.querySelector(':scope > .main-menu--sub');
                  if (nestedSubmenu) {
                    nestedSubmenu.classList.remove('main-menu--sub-open');
                    nestedSubmenu.classList.remove('main-menu-sub-menu-opened');
                  }
                  const nestedExpandSub = nestedItem.querySelector(':scope > .expand-sub');
                  if (nestedExpandSub) {
                    nestedExpandSub.classList.remove('expand-sub--open');
                  }
                });
              }
              const expandSub = item.querySelector(':scope > .expand-sub');
              if (expandSub) {
                expandSub.classList.remove('expand-sub--open');
              }
            });

            // Don't open the clicked menu yet - user needs to click again
            return;
          }
        }
      }
    } else {
      // Child submenu item: close siblings at the same level only
      const parentUl = menuItem.parentElement;
      parentUl.querySelectorAll(':scope > li.main-menu__item--with-sub.active').forEach((item) => {
        if (item !== menuItem) {
          item.classList.remove('active');
          const otherSubmenu = item.querySelector(':scope > .main-menu--sub');
          if (otherSubmenu) {
            otherSubmenu.classList.remove('main-menu--sub-open');
            otherSubmenu.classList.remove('main-menu-sub-menu-opened');
          }
        }
      });
    }
  }

  // On mobile: Close other submenus at the same level only
  if (!isDesktop.matches) {
    const parentUl = menuItem.parentElement;
    parentUl.querySelectorAll(':scope > li.main-menu__item--with-sub.active').forEach((item) => {
      if (item !== menuItem) {
        item.classList.remove('active');
        const otherSubmenu = item.querySelector(':scope > .main-menu--sub');
        if (otherSubmenu) {
          otherSubmenu.classList.remove('main-menu--sub-open');
          otherSubmenu.classList.remove('main-menu-sub-menu-opened');
        }
      }
    });
  }

  // Toggle the current menu item
  menuItem.classList.toggle('active', !isActive);

  // Toggle submenu open class
  if (submenu) {
    submenu.classList.toggle('main-menu--sub-open', !isActive);

    // On mobile, add the special class for full submenu view
    if (!isDesktop.matches) {
      if (!isActive) {
        // Opening submenu on mobile
        submenu.classList.add('main-menu-sub-menu-opened');

        // Find the root main menu or parent submenu to hide siblings
        let menuToHide;

        // Check if this is a nested submenu (parent is also a submenu)
        const parentSubmenu = menuItem.closest('.main-menu--sub');
        if (parentSubmenu) {
          // This is a nested submenu - hide items in the parent submenu
          menuToHide = parentSubmenu;
        } else {
          // This is a top-level submenu - hide items in main menu
          menuToHide = document.querySelector('.main-menu');
        }

        if (menuToHide) {
          menuToHide.classList.add('main-menu-sub-menu-open');
        }
      } else {
        // Closing submenu on mobile
        submenu.classList.remove('main-menu-sub-menu-opened');

        // Remove class from parent menu
        const parentSubmenu = menuItem.closest('.main-menu--sub');
        const menuToShow = parentSubmenu || document.querySelector('.main-menu');

        if (menuToShow) {
          menuToShow.classList.remove('main-menu-sub-menu-open');
        }
      }
    }
  }
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} mainNav The main nav menu within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, mainNav, forceExpanded = null) {
  const button = document.getElementById('toggle-expand');

  // Determine if we should expand or collapse
  let shouldExpand;
  if (forceExpanded !== null) {
    // Explicit state requested
    shouldExpand = forceExpanded;
  } else {
    // Toggle current state
    shouldExpand = nav.getAttribute('aria-expanded') !== 'true';
  }

  // Don't block page scrolling - menu uses position: absolute, not fixed
  // So page should remain scrollable when menu is open

  // Set aria-expanded attribute
  nav.setAttribute('aria-expanded', shouldExpand ? 'true' : 'false');

  // Toggle .open class on nav for CSS
  if (shouldExpand) {
    nav.classList.add('open');
  } else {
    nav.classList.remove('open');

    // Reset all submenus to closed state when menu closes
    if (!isDesktop.matches) {
      // Remove active class from all menu items
      mainNav.querySelectorAll('.main-menu__item--with-sub').forEach((item) => {
        item.classList.remove('active');
      });

      // Close all open submenus
      mainNav.querySelectorAll('.main-menu--sub').forEach((submenu) => {
        submenu.classList.remove('main-menu--sub-open');
        submenu.classList.remove('main-menu-sub-menu-opened');
      });

      // Reset main menu and any parent submenu states
      const mainMenu = mainNav.querySelector('.main-menu');
      if (mainMenu) {
        mainMenu.classList.remove('main-menu-sub-menu-open');
      }
      mainNav.querySelectorAll('.main-menu--sub').forEach((submenu) => {
        submenu.classList.remove('main-menu-sub-menu-open');
      });
    }
  }

  // Toggle all submenu items (for desktop)
  mainNav.querySelectorAll('.main-menu__item--with-sub').forEach((item) => {
    if (!isDesktop.matches && !shouldExpand) {
      item.classList.remove('active');
    }
  });

  button.setAttribute('aria-label', shouldExpand ? 'Close navigation' : 'Open navigation');

  // Enable menu collapse on escape keypress
  if (shouldExpand) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
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

    // Get the text/link content - look for direct children excluding nested ul
    let content = null;
    let textContent = '';
    let anchor = null;
    
    // First, check if there's an anchor tag anywhere in the item (excluding nested ul)
    const allNodes = Array.from(item.childNodes);
    allNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'UL') {
        if (node.tagName === 'A') {
          // Direct anchor tag
          anchor = node;
          if (!content) content = node;
        } else if (node.querySelector) {
          // Look for anchor inside this element
          const foundAnchor = node.querySelector('a');
          if (foundAnchor && !anchor) {
            anchor = foundAnchor;
          }
          if (!content) content = node;
        } else if (!content) {
          content = node;
        }
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        if (!textContent) textContent = node.textContent.trim();
      }
    });

    // If no content element found but we have text, create a text node reference
    if (!content && textContent) {
      content = { textContent };
    }

    // Extract text content more robustly - get only direct text, not nested ul content
    let itemText = '';
    
    // Helper function to get direct text content excluding nested UL elements
    const getDirectTextContent = (element) => {
      // Check if element has childNodes (is a real DOM element)
      if (!element || !element.childNodes) {
        // If it's a simple object with textContent, return that
        return element?.textContent?.trim() || '';
      }
      
      let text = '';
      Array.from(element.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'UL' && child.tagName !== 'IMG') {
          // For non-UL, non-IMG elements, get their text recursively but stop at UL
          const childText = getDirectTextContent(child);
          if (childText) text += childText;
        }
      });
      return text.trim();
    };
    
    if (anchor) {
      // Get direct text from anchor, excluding nested ul
      itemText = getDirectTextContent(anchor);
    } else if (content) {
      // Try to get text content, excluding images and nested ul
      itemText = getDirectTextContent(content);
    } else if (textContent) {
      itemText = textContent;
    }

    let menuLink;
    
    // Process the menu item based on what content we found
    if (itemText || anchor) {
      
      if (anchor && !hasSubmenu) {
        // Regular link item (no submenu)
        menuLink = document.createElement('a');
        menuLink.href = anchor.href;
        menuLink.title = anchor.title || itemText;
        menuLink.textContent = itemText;
        menuLink.className = level === 0
          ? 'main-menu__link'
          : `main-menu__link main-menu__link--sub main-menu__link--sub-${level}`;

        if (anchor.target) menuLink.target = anchor.target;

        // Add special classes based on data attributes or existing classes from source
        const dataLinkStyle = anchor.dataset?.linkStyle || anchor.parentElement?.dataset.linkStyle;
        if (dataLinkStyle) {
          menuLink.classList.add(dataLinkStyle);
        }

        // Preserve any meaningful classes from the original anchor
        const excludeClasses = ['button', 'button-container', 'default-content-wrapper'];
        anchor.classList.forEach((className) => {
          if (!excludeClasses.includes(className)) {
            menuLink.classList.add(className);
          }
        });

        // Look for icon - check in item and content
        let icon = item.querySelector('img');
        if (!icon && content.querySelector) {
          icon = content.querySelector('img');
        }

        if (icon) {
          const iconName = icon.dataset?.iconName || icon.alt || 'icon';
          const iconSrc = icon.getAttribute('src');

          menuLink.classList.add(`icon-${iconName}`);

          if (iconSrc) {
            menuLink.setAttribute('data-icon-src', iconSrc);
          }

          // Check for mobile icon version
          const parts = iconSrc.split('/');
          const filename = parts[parts.length - 1];
          const filenameWithoutExt = filename.replace(/\.[^.]+$/, '');
          const ext = filename.match(/\.[^.]+$/)?.[0] || '.svg';
          const basePath = iconSrc.substring(0, iconSrc.lastIndexOf('/') + 1);

          const mobileOptions = [
            `${basePath}${filenameWithoutExt}-mobile${ext}`,
            `${basePath}${filenameWithoutExt.replace(/-icon$/, '')}-mobile${ext}`,
            `${basePath}${filenameWithoutExt.replace(/-icon$/, '-mobile-icon')}${ext}`,
          ];

          fetch(mobileOptions[0], { method: 'HEAD' }).then((response) => {
            if (response.ok && mobileOptions[0].includes('-mobile')) {
              menuLink.setAttribute('data-icon-mobile-src', mobileOptions[0]);
            }
          }).catch(() => {});
        }
      } else {
        // Item with submenu or span (no href)
        menuLink = document.createElement('span');
        menuLink.textContent = itemText;

        if (hasSubmenu) {
          menuLink.className = level === 0
            ? 'main-menu__link main-menu__link--with-sub'
            : `main-menu__link main-menu__link--sub main-menu__link--sub-${level} main-menu__link--with-sub`;
          menuLink.setAttribute('tabindex', '0');
        } else {
          menuLink.className = level === 0
            ? 'main-menu__link'
            : `main-menu__link main-menu__link--sub main-menu__link--sub-${level}`;
        }

        // Add special classes based on data attributes
        if (content.dataset) {
          const dataLinkStyle = content.dataset.linkStyle || content.parentElement?.dataset.linkStyle;
          if (dataLinkStyle) {
            menuLink.classList.add(dataLinkStyle);
          }
        }

        // Preserve any meaningful classes
        if (content.classList) {
          const excludeClasses = ['button', 'button-container', 'default-content-wrapper'];
          content.classList.forEach((className) => {
            if (!excludeClasses.includes(className)) {
              menuLink.classList.add(className);
            }
          });
        }

        // Look for icon
        let icon = item.querySelector('img');
        if (!icon && content.querySelector) {
          icon = content.querySelector('img');
        }

        if (icon) {
          const iconName = icon.dataset?.iconName || icon.alt || 'icon';
          const iconSrc = icon.getAttribute('src');

          menuLink.classList.add(`icon-${iconName}`);

          if (iconSrc) {
            menuLink.setAttribute('data-icon-src', iconSrc);
          }

          // Check for mobile icon version
          const parts = iconSrc.split('/');
          const filename = parts[parts.length - 1];
          const filenameWithoutExt = filename.replace(/\.[^.]+$/, '');
          const ext = filename.match(/\.[^.]+$/)?.[0] || '.svg';
          const basePath = iconSrc.substring(0, iconSrc.lastIndexOf('/') + 1);

          const mobileOptions = [
            `${basePath}${filenameWithoutExt}-mobile${ext}`,
            `${basePath}${filenameWithoutExt.replace(/-icon$/, '')}-mobile${ext}`,
            `${basePath}${filenameWithoutExt.replace(/-icon$/, '-mobile-icon')}${ext}`,
          ];

          fetch(mobileOptions[0], { method: 'HEAD' }).then((response) => {
            if (response.ok && mobileOptions[0].includes('-mobile')) {
              menuLink.setAttribute('data-icon-mobile-src', mobileOptions[0]);
            }
          }).catch(() => {});
        }
      }

      // Append the menuLink to menuItem
      menuItem.appendChild(menuLink);
    } else if (hasSubmenu) {
      // li has only a ul child (no text content) - still create a clickable element
      menuLink = document.createElement('span');
      menuLink.textContent = 'Menu'; // Fallback text
      menuLink.className = level === 0
        ? 'main-menu__link main-menu__link--with-sub'
        : `main-menu__link main-menu__link--sub main-menu__link--sub-${level} main-menu__link--with-sub`;
      menuLink.setAttribute('tabindex', '0');
      
      menuItem.appendChild(menuLink);
    }

    // Process submenu if it exists (recursively)
    if (hasSubmenu) {
      const expandSub = document.createElement('span');
      expandSub.className = 'expand-sub';
      menuItem.appendChild(expandSub);

      const currentExpandSub = expandSub;
      const currentMenuItem = menuItem;

      // Add click handler for submenu toggle
      if (menuLink) {
        menuLink.addEventListener('click', (e) => {
          if (menuLink.tagName === 'SPAN') {
            e.preventDefault();
            e.stopPropagation();
            toggleSubmenu(currentMenuItem);
            if (currentMenuItem.classList.contains('active')) {
              currentExpandSub.classList.add('expand-sub--open');
            } else {
              currentExpandSub.classList.remove('expand-sub--open');
            }
          }
        });

        menuLink.addEventListener('focus', focusMenuItem);
      }

      expandSub.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSubmenu(currentMenuItem);
        if (currentMenuItem.classList.contains('active')) {
          currentExpandSub.classList.add('expand-sub--open');
        } else {
          currentExpandSub.classList.remove('expand-sub--open');
        }
      });

      // Recursively process the submenu
      const submenu = item.querySelector(':scope > ul');
      if (submenu) {
        const convertedSubmenu = convertToMainMenu(submenu, level + 1);
        addGoBackLink(convertedSubmenu, level + 1);
        menuItem.appendChild(convertedSubmenu);
      }
    }

    // Always append the menuItem to the menu, but only if it has content or submenu
    if (menuLink || hasSubmenu) {
      menu.appendChild(menuItem);
    }
  });

  return menu;
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

  // Process fragment sections to find call now section
  const allSections = fragment.querySelectorAll(':scope > div.section, :scope > div');
  let callNowSection = null;

  allSections.forEach((section) => {
    // Look for a section with "call now" class or text content
    if (section.classList.contains('call-now')
        || section.textContent.toLowerCase().includes('call')
        || section.querySelector('p')?.textContent.toLowerCase().includes('call')) {
      // Make sure it's not the navigation section
      if (!section.querySelector('ul') && !section.classList.contains('nav-sections')) {
        callNowSection = section;
      }
    }
  });

  // Create region-top section (above header)
  const regionTop = document.createElement('div');
  regionTop.className = 'region region-top clearfix';

  const phoneBlock = document.createElement('div');
  phoneBlock.id = 'block-phonefax';
  phoneBlock.className = 'block block-content-phone--fax block-content-paragraphs block-content-phone--fax block-content-paragraphs';
  phoneBlock.setAttribute('data-block-plugin-id', 'block_content:76e4c96b-f912-44a7-a081-694cd6184460');

  const fieldItems = document.createElement('div');
  fieldItems.className = 'field field--name-field-paragraph field--type-entity-reference-revisions field--label-hidden field__items';

  const fieldItem = document.createElement('div');
  fieldItem.className = 'field__item';

  const paragraph = document.createElement('div');
  paragraph.className = 'paragraph paragraph--wrapper-text';

  const content = document.createElement('div');
  content.className = 'content';

  const textWrapper = document.createElement('div');
  textWrapper.className = 'text-wrapper';

  const textLong = document.createElement('div');
  textLong.className = 'text-long';

  // Check if we found a call now section with authored content
  if (callNowSection) {
    // Look for the paragraph with the phone content
    const authoredPara = callNowSection.querySelector('p');
    if (authoredPara) {
      const phoneText = document.createElement('p');
      phoneText.className = 'align-center d-flex justify-content-center white';

      // Check if there's an icon in the authored content
      const icon = authoredPara.querySelector('img');
      if (icon) {
        const iconName = icon.dataset?.iconName || icon.alt || 'phone-without-bg';
        const iconSrc = icon.src || icon.getAttribute('src');
        phoneText.classList.add(`icon-${iconName}--before`);

        // Set the icon as a CSS custom property so ::before can use it
        if (iconSrc) {
          phoneText.style.setProperty('--icon-url', `url(${iconSrc})`);
        }
      } else {
        // Default to phone icon if no icon specified
        phoneText.classList.add('icon-phone--before');
      }

      // Get the text content (without the image)
      const textContent = Array.from(authoredPara.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'IMG'))
        .map((node) => node.textContent)
        .join('')
        .trim();

      phoneText.textContent = textContent;
      textLong.appendChild(phoneText);
    } else {
      // Fallback to default if no paragraph found
      const phoneText = document.createElement('p');
      phoneText.className = 'align-center d-flex justify-content-center white icon-phone--before';
      phoneText.textContent = 'Call 1-855-727-6274 or Fax 1-844-727-6274';
      textLong.appendChild(phoneText);
    }
  } else {
    // Fallback to default hardcoded text if no call now section found
    const phoneText = document.createElement('p');
    phoneText.className = 'align-center d-flex justify-content-center white icon-phone--before';
    phoneText.textContent = 'Call 1-855-727-6274 or Fax 1-844-727-6274';
    textLong.appendChild(phoneText);
  }

  textWrapper.appendChild(textLong);
  content.appendChild(textWrapper);
  paragraph.appendChild(content);
  fieldItem.appendChild(paragraph);
  fieldItems.appendChild(fieldItem);
  phoneBlock.appendChild(fieldItems);
  regionTop.appendChild(phoneBlock);

  // Add region-top to the block first
  block.appendChild(regionTop);

  // Create container and region structure for main header
  const container = document.createElement('div');
  container.className = 'container';

  const region = document.createElement('div');
  region.className = 'region region-header-top clearfix';

  // Process fragment sections - look for .section divs or direct children
  const sections = fragment.querySelectorAll(':scope > div.section, :scope > div');

  // Find the brand section (logo) and menu section
  let brandSection = null;
  let menuSection = null;

  sections.forEach((section) => {
    // Check for site-branding class
    if (section.classList.contains('site-branding')) {
      brandSection = section;
    } else if (section.classList.contains('navigation')) {
      // Check for navigation class for menu
      menuSection = section;
    } else if (section.classList.contains('nav-brand')) {
      // Fallback: Check for nav-brand class (legacy support)
      brandSection = section;
    } else if (section.classList.contains('nav-sections')) {
      // Fallback: Check for nav-sections class for menu (legacy support)
      menuSection = section;
    } else if (section.querySelector('ul') && !menuSection) {
      // Look for menu section (has ul)
      menuSection = section;
    } else if (!brandSection
      && !section.querySelector('ul')
      && section.querySelector('picture, img')) {
      // Look for brand section (first with image/picture, no ul, not call section)
      // Make sure this isn't the "call now" section
      const textContent = section.textContent.toLowerCase();
      const isCallSection = textContent.includes('call')
        || textContent.includes('fax')
        || section.classList.contains('call-now');

      if (!isCallSection) {
        brandSection = section;
      }
    }
  });

  // First section: Site Branding (Logo)
  if (brandSection) {
    // Create wrapper div with section class and style
    const brandWrapper = document.createElement('div');
    // Preserve classes like "section site-branding"
    brandWrapper.className = brandSection.className;

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
      const cloned = logoImg.cloneNode(true);

      // If it's an img element, ensure src attribute is preserved
      if (cloned.tagName === 'IMG') {
        const originalSrc = logoImg.getAttribute('src');
        if (originalSrc && originalSrc !== cloned.getAttribute('src')) {
          cloned.setAttribute('src', originalSrc);
        }
      }

      logoLink.appendChild(cloned);
    }

    siteBranding.appendChild(logoLink);
    brandWrapper.appendChild(siteBranding);
    region.appendChild(brandWrapper);
  }

  // Add "Call Us" link block (appears on mobile)
  const callUsBlock = document.createElement('div');
  callUsBlock.id = 'block-calluslink';
  callUsBlock.className = 'block block-content-call-us-link block-content-basic block-content-call-us-link block-content-basic';
  callUsBlock.setAttribute('data-block-plugin-id', 'block_content:ea999aaa-6c4b-41d7-9595-7b03786bc779');

  const textLongDiv = document.createElement('div');
  textLongDiv.className = 'text-long';

  const callUsPara = document.createElement('p');
  const callUsLink = document.createElement('a');
  callUsLink.className = 'call-us';
  callUsLink.href = 'tel:18557276274';
  callUsLink.textContent = 'Call Us';

  callUsPara.appendChild(callUsLink);
  textLongDiv.appendChild(callUsPara);
  callUsBlock.appendChild(textLongDiv);
  region.appendChild(callUsBlock);

  // Second section: Navigation Menu
  if (menuSection) {
    // Create wrapper div with section class and style
    const navWrapper = document.createElement('div');
    // Preserve classes like "section navigation"
    navWrapper.className = menuSection.className;

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

    const navInnerWrapper = document.createElement('div');

    // Create toggle expand button (using button instead of link)
    const toggleExpand = document.createElement('button');
    toggleExpand.type = 'button';
    toggleExpand.id = 'toggle-expand';
    toggleExpand.className = 'toggle-expand';
    toggleExpand.setAttribute('aria-label', 'Open navigation');
    toggleExpand.innerHTML = `
      <span class="toggle-expand__open">
        <span class="toggle-expand__text"></span>
      </span>
      <span class="toggle-expand__close">
        <span class="toggle-expand__text"></span>
      </span>
    `;
    navInnerWrapper.appendChild(toggleExpand);

    // Create main nav container
    const mainNav = document.createElement('div');
    mainNav.id = 'main-nav';
    mainNav.className = 'main-nav';

    // Convert the section's ul to main-menu - look deeper in the structure
    const originalUl = menuSection.querySelector('ul');
    if (originalUl) {
      const mainMenu = convertToMainMenu(originalUl, 0);

      // Add "Call us" link as the last item in the main menu (mobile only)
      const callUsItem = document.createElement('li');
      callUsItem.className = 'main-menu__item';

      const callUsMenuLink = document.createElement('a');
      callUsMenuLink.href = 'tel:18557276274';
      callUsMenuLink.target = '_self';
      callUsMenuLink.className = 'call-us-menu-link main-menu__link';
      callUsMenuLink.textContent = 'Call us';

      callUsItem.appendChild(callUsMenuLink);
      mainMenu.appendChild(callUsItem);

      mainNav.appendChild(mainMenu);
    }

    navInnerWrapper.appendChild(mainNav);
    nav.appendChild(navInnerWrapper);

    // Add toggle functionality - only close when menu is open
    toggleExpand.addEventListener('click', (e) => {
      e.preventDefault();
      const navElement = document.getElementById('block-mainmenu');
      const isExpanded = navElement.getAttribute('aria-expanded') === 'true';

      // Only toggle if menu is already open (to close it)
      // Or if menu is closed (to open it)
      if (isExpanded) {
        // Menu is open, close it
        toggleMenu(navElement, mainNav, false);
      } else {
        // Menu is closed, open it
        toggleMenu(navElement, mainNav, true);
      }
    });

    navWrapper.appendChild(nav);
    region.appendChild(navWrapper);
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

  // Add click outside handler for desktop - close all submenus
  document.addEventListener('click', closeOnClickOutside);

  // Add Tab key handler for menu accessibility
  handleTabKey();
}
