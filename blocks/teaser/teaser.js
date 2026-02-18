import { moveInstrumentation } from '../../scripts/scripts.js';

// Valid style classes that can be applied to the teaser
const STYLE_CLASSES = ['image-left', 'image-right', 'icon-teaser'];

// Valid heading sizes
const HEADING_SIZES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

export default async function decorate(block) {
  const rows = [...block.children];

  // Default heading tag, may be overridden by row 2
  let headingTag = 'h2';

  // First pass: check row 2 for heading size
  if (rows[2]) {
    const cell = rows[2].children[0];
    if (cell) {
      const textContent = cell.textContent.trim().toLowerCase();
      if (HEADING_SIZES.includes(textContent)) {
        headingTag = textContent;
      }
    }
  }

  // Also check block classes for heading size (e.g., teaser-h3 -> h3)
  const headingSizeClass = [...block.classList].find((c) => /^h[1-6]$/.test(c));
  if (headingSizeClass) {
    headingTag = headingSizeClass;
  }

  // Create teaser structure
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image';

  const contentContainer = document.createElement('div');
  contentContainer.className = 'content';

  const title = document.createElement(headingTag);
  title.className = 'title';

  const bodyText = document.createElement('div');
  bodyText.className = 'body-text';

  const linkContainer = document.createElement('div');
  linkContainer.className = 'link';

  // Process rows by position
  // Row 0: Image
  // Row 1: Title
  // Row 2: Heading type (h1-h6)
  // Row 3: Body text
  // Row 4: CTA link
  // Row 5: Style classes
  rows.forEach((row, index) => {
    const cell = row.children[0];
    if (!cell) return;

    const picture = cell.querySelector('picture');
    const link = cell.querySelector('a');
    const textContent = cell.textContent.trim();

    switch (index) {
      case 0: // Image
        if (picture) {
          moveInstrumentation(row, imageContainer);
          imageContainer.appendChild(picture);
        }
        break;
      case 1: // Title
        if (textContent) {
          moveInstrumentation(row, title);
          const p = cell.querySelector('p');
          title.textContent = p ? p.textContent : textContent;
        }
        break;
      case 2: // Heading type - already processed above
        break;
      case 3: // Body text
        if (textContent) {
          moveInstrumentation(row, bodyText);
          bodyText.innerHTML = cell.innerHTML;
        }
        break;
      case 4: // CTA link
        if (link) {
          moveInstrumentation(row, linkContainer);
          link.className = 'button';
          linkContainer.appendChild(link);
        }
        break;
      case 5: // Style classes
        if (textContent) {
          const classes = textContent.split(/[,\s]+/).map((c) => c.toLowerCase().trim());
          classes.forEach((cls) => {
            if (STYLE_CLASSES.includes(cls)) {
              block.classList.add(cls);
            }
          });
        }
        break;
      default:
        break;
    }
    row.remove();
  });

  // Build the teaser structure - only add non-empty elements
  if (title.innerHTML) {
    contentContainer.appendChild(title);
  }
  if (bodyText.innerHTML) {
    contentContainer.appendChild(bodyText);
  }
  if (linkContainer.children.length > 0) {
    contentContainer.appendChild(linkContainer);
  }

  // Clear and rebuild block - only add non-empty containers
  block.textContent = '';
  if (imageContainer.children.length > 0) {
    block.appendChild(imageContainer);
  }
  if (contentContainer.children.length > 0) {
    block.appendChild(contentContainer);
  }
}
