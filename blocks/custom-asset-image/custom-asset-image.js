import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Asset Picker Configuration
 * These settings control how assets are filtered and delivered
 */
const ASSET_CONFIG = {
  // Dynamic Media delivery domains
  dmOpenApiDomain: 'delivery-p172753-e1855059.adobeaemcloud.com',
  scene7Domain: 's7d1.scene7.com/is/image/OtsukaUSDynamicMedia',

  // Responsive breakpoints for optimized images
  breakpoints: [
    { media: '(min-width: 1200px)', width: '2000' },
    { media: '(min-width: 900px)', width: '1200' },
    { media: '(min-width: 600px)', width: '800' },
    { width: '750' },
  ],

  // Smart crop configurations (if enabled in DM)
  smartCrops: {
    Small: { minWidth: 0, maxWidth: 767 },
    Medium: { minWidth: 768, maxWidth: 1023 },
    Large: { minWidth: 1024, maxWidth: 9999 },
  },
};

/**
 * Check if URL is a Dynamic Media URL
 * @param {string} src - Image source URL
 * @returns {string|null} - Returns 'dmOpenApi', 'scene7', or null
 */
function getDMType(src) {
  if (src.includes(ASSET_CONFIG.dmOpenApiDomain)) {
    return 'dmOpenApi';
  }
  if (src.includes(ASSET_CONFIG.scene7Domain) || src.includes('scene7.com')) {
    return 'scene7';
  }
  return null;
}

/**
 * Create optimized picture element for Dynamic Media Open API
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text
 * @param {boolean} eager - Eager loading flag
 * @returns {HTMLElement} - Picture element
 */
function createDMOpenAPIPicture(src, alt, eager = false) {
  // Use the AEM Assets Plugin if available
  if (window.hlx?.aemassets?.createOptimizedPictureForDMOpenAPI) {
    return window.hlx.aemassets.createOptimizedPictureForDMOpenAPI(
      src,
      alt,
      true, // useSmartcrop
      eager,
      ASSET_CONFIG.breakpoints,
    );
  }

  // Fallback to standard picture creation with DM params
  const picture = document.createElement('picture');

  ASSET_CONFIG.breakpoints.forEach(({ media, width }) => {
    const source = document.createElement('source');
    if (media) source.setAttribute('media', media);

    // Add DM Open API parameters
    const dmUrl = new URL(src);
    dmUrl.searchParams.set('width', width);
    dmUrl.searchParams.set('format', 'webply');
    dmUrl.searchParams.set('preferwebp', 'true');

    source.setAttribute('srcset', dmUrl.toString());
    source.setAttribute('type', 'image/webp');
    picture.appendChild(source);
  });

  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = eager ? 'eager' : 'lazy';
  picture.appendChild(img);

  return picture;
}

/**
 * Create optimized picture element for Scene7
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text
 * @param {boolean} eager - Eager loading flag
 * @returns {HTMLElement} - Picture element
 */
function createScene7Picture(src, alt, eager = false) {
  // Use the AEM Assets Plugin if available
  if (window.hlx?.aemassets?.createOptimizedPictureForDM) {
    return window.hlx.aemassets.createOptimizedPictureForDM(
      src,
      alt,
      eager,
      ASSET_CONFIG.breakpoints,
    );
  }

  // Fallback to standard picture creation with Scene7 params
  const picture = document.createElement('picture');

  ASSET_CONFIG.breakpoints.forEach(({ media, width }) => {
    const source = document.createElement('source');
    if (media) source.setAttribute('media', media);

    // Add Scene7 parameters
    const separator = src.includes('?') ? '&' : '?';
    const dmUrl = `${src}${separator}wid=${width}&fmt=webp&qlt=85`;

    source.setAttribute('srcset', dmUrl);
    source.setAttribute('type', 'image/webp');
    picture.appendChild(source);
  });

  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = eager ? 'eager' : 'lazy';
  picture.appendChild(img);

  return picture;
}

/**
 * Custom Asset Image block
 * This block uses the Adobe Custom Asset Picker for enhanced asset selection
 * with configurable filters and Dynamic Media delivery options.
 * @param {Element} block - The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  let imageElement = null;
  let altText = '';

  rows.forEach((row) => {
    const cell = row.children[0];
    const img = cell.querySelector('img');
    const textContent = cell.textContent.trim();

    if (img && img.src) {
      // Image from asset picker
      imageElement = img;
    } else if (textContent && !img) {
      // Alt text
      altText = textContent;
    }
  });

  // Clear the block
  block.innerHTML = '';

  // Create optimized picture if image exists
  if (imageElement) {
    const { src } = imageElement;
    const alt = altText || imageElement.alt || 'Image';
    const dmType = getDMType(src);

    let optimizedPicture;

    if (dmType === 'dmOpenApi') {
      // Use DM Open API optimization
      optimizedPicture = createDMOpenAPIPicture(src, alt, false);
      block.classList.add('dm-open-api');
    } else if (dmType === 'scene7') {
      // Use Scene7 optimization
      optimizedPicture = createScene7Picture(src, alt, false);
      block.classList.add('dm-scene7');
    } else {
      // Fallback to standard EDS optimization
      optimizedPicture = createOptimizedPicture(
        src,
        alt,
        false,
        ASSET_CONFIG.breakpoints,
      );
    }

    block.appendChild(optimizedPicture);
  }
}
