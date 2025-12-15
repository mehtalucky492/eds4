import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Initialize back-to-top button behavior
 * @param {Element} button The back-to-top button element
 * @param {Element} footerBlock The footer block element
 */
function initBackToTop(button, footerBlock) {
  let footerHeight = 0;
  let windowHeight = 0;

  // Calculate dimensions
  function updateDimensions() {
    footerHeight = footerBlock.offsetHeight || 380;
    windowHeight = window.innerHeight;
  }

  // Show/hide button based on scroll position
  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const footerTop = footerBlock.offsetTop;

    // Show button when user scrolls down and reaches near the footer
    if (scrollTop + windowHeight - footerHeight / 2 > footerTop) {
      button.classList.add('visible');
    } else {
      button.classList.remove('visible');
    }
  }

  // Scroll to top smoothly
  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });

  // Initialize
  updateDimensions();
  handleScroll();

  // Listen to scroll and resize events
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', () => {
    updateDimensions();
    handleScroll();
  });
  window.addEventListener('load', () => {
    updateDimensions();
    handleScroll();
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Add section-top class and identify logo in sections with 'top' class
  const sections = footer.querySelectorAll('.section.top, .field-item.top');
  sections.forEach((section) => {
    // Add section-top class
    section.classList.add('section-top');

    // Look for <p> tag containing a <picture> tag
    const paragraphs = section.querySelectorAll('p');
    paragraphs.forEach((p) => {
      const picture = p.querySelector('picture');
      if (picture) {
        p.classList.add('logo');
      }
    });

    // Look for <ul> tag and add main-menu class
    const ulElements = section.querySelectorAll('ul');
    ulElements.forEach((ul) => {
      ul.classList.add('main-menu');

      // Add main-menu_item class to all <li> elements within this <ul>
      const liElements = ul.querySelectorAll('li');
      liElements.forEach((li) => {
        li.classList.add('main-menu_item');
      });
    });
  });

  // Add classes to middle section
  const middleSection = footer.querySelector('.section.middle');
  if (middleSection) {
    const contentWrapper = middleSection.querySelector('.default-content-wrapper');
    if (contentWrapper) {
      // Add text-long class to the wrapper
      contentWrapper.classList.add('text-long');

      // Add copyright-notice class to all p tags within
      const paragraphs = contentWrapper.querySelectorAll('p');
      paragraphs.forEach((p) => {
        p.classList.add('copyright-notice');
      });
    }
  }

  // Add classes to PRC date and code p tags
  // Find the p tag in .section.bottom that contains the date and code
  const bottomSection = footer.querySelector('.section.bottom');
  if (bottomSection) {
    const paragraphs = bottomSection.querySelectorAll('p');
    paragraphs.forEach((p) => {
      const text = p.textContent.trim();

      // Check if this is the copyright paragraph
      const isCopyright = text.includes('©')
        || text.toLowerCase().includes('copyright')
        || text.includes('All rights reserved');
      if (isCopyright) {
        p.classList.add('copyright');
      }

      // Check if this p tag contains a date pattern and code pattern
      const dateCodePattern = /([A-Za-z]+\s+\d{4})\s+([A-Z0-9]+)/;
      const match = text.match(dateCodePattern);

      if (match) {
        // This p tag contains both date and code
        // Split the content and wrap each part
        const dateText = match[1];
        const codeText = match[2];

        // Add prc class to the p tag
        p.classList.add('prc');

        // Create wrapper spans with classes
        const spanHtml = `<span class="prc-date">${dateText}</span> `;
        p.innerHTML = `${spanHtml}<span class="prc-code">${codeText}</span>`;
      }
    });
  }

  block.append(footer);

  // Add back-to-top button
  const backToTopWrapper = document.createElement('div');
  backToTopWrapper.className = 'back-to-top-buttons d-flex justify-content-center';

  const backToTopButton = document.createElement('button');
  backToTopButton.id = 'back-to-top';
  backToTopButton.className = 'back-to-top-button__oval text-uppercase sticky-back-to-top-to-buttom';
  backToTopButton.setAttribute('aria-label', 'Back to top');
  backToTopButton.innerHTML = `
    <span class="text-center">
      <span class="text-span"></span>
    </span>
  `;

  backToTopWrapper.append(backToTopButton);
  block.append(backToTopWrapper);

  // Initialize back-to-top functionality
  initBackToTop(backToTopButton, block);
}
