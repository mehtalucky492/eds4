/**
 * Asset Picker Configuration
 * These settings control how assets are filtered and delivered
 */
const ASSET_CONFIG = {
  // Dynamic Media delivery domains
  dmOpenApiDomain: 'delivery-p172753-e1855059.adobeaemcloud.com',
  scene7Domain: 's7d1.scene7.com/is/content/OtsukaUSDynamicMedia',

  // Supported video formats
  supportedFormats: ['mp4', 'webm', 'ogg', 'm4v', 'mov'],
};

/**
 * Check if URL is a Dynamic Media URL
 * @param {string} src - Video source URL
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
 * Get video format from URL
 * @param {string} src - Video source URL
 * @returns {string} - Video MIME type
 */
function getVideoMimeType(src) {
  const url = new URL(src, window.location.origin);
  const pathname = url.pathname.toLowerCase();

  if (pathname.endsWith('.webm')) return 'video/webm';
  if (pathname.endsWith('.ogg') || pathname.endsWith('.ogv')) return 'video/ogg';
  if (pathname.endsWith('.m4v') || pathname.endsWith('.mov')) return 'video/mp4';
  return 'video/mp4'; // Default to mp4
}

/**
 * Create video element with optimized settings
 * @param {string} src - Video source URL
 * @param {string} alt - Alt text / title
 * @param {Object} options - Video options
 * @returns {HTMLElement} - Video element
 */
function createVideoElement(src, alt, options = {}) {
  const {
    autoplay = false,
    muted = true,
    loop = false,
    controls = true,
    poster = '',
  } = options;

  const video = document.createElement('video');
  video.setAttribute('title', alt);
  video.controls = controls;
  video.muted = muted;
  video.playsInline = true;

  if (autoplay) {
    video.autoplay = true;
    video.muted = true; // Autoplay requires muted
  }
  if (loop) video.loop = true;
  if (poster) video.poster = poster;

  // Create source element
  const source = document.createElement('source');
  source.src = src;
  source.type = getVideoMimeType(src);
  video.appendChild(source);

  // Fallback text
  const fallback = document.createElement('p');
  fallback.textContent = 'Your browser does not support the video tag.';
  video.appendChild(fallback);

  return video;
}

/**
 * Create video element for Dynamic Media Open API
 * @param {string} src - Video source URL
 * @param {string} alt - Alt text
 * @param {Object} options - Video options
 * @returns {HTMLElement} - Video element
 */
function createDMOpenAPIVideo(src, alt, options = {}) {
  // Add DM Open API parameters if needed
  const dmUrl = new URL(src);
  dmUrl.searchParams.set('format', 'mp4');

  return createVideoElement(dmUrl.toString(), alt, options);
}

/**
 * Create video element for Scene7
 * @param {string} src - Video source URL
 * @param {string} alt - Alt text
 * @param {Object} options - Video options
 * @returns {HTMLElement} - Video element
 */
function createScene7Video(src, alt, options = {}) {
  // Scene7 video URLs typically use /is/content/ path
  return createVideoElement(src, alt, options);
}

/**
 * Custom Asset Video block
 * This block uses the Adobe Custom Asset Picker for enhanced asset selection
 * with configurable filters and Dynamic Media delivery options.
 * @param {Element} block - The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  let videoSrc = '';
  let altText = '';
  let posterSrc = '';
  const videoOptions = {
    autoplay: false,
    muted: true,
    loop: false,
    controls: true,
  };

  rows.forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      const anchor = cell.querySelector('a');
      const video = cell.querySelector('video');
      const img = cell.querySelector('img');
      const textContent = cell.textContent.trim().toLowerCase();

      if (anchor && anchor.href) {
        // Video URL from asset picker (anchor tag for DM delivery)
        videoSrc = anchor.href;
      } else if (video) {
        // Direct video element
        const source = video.querySelector('source');
        if (source && source.src) {
          videoSrc = source.src;
        } else if (video.src) {
          videoSrc = video.src;
        }
      } else if (img && img.src) {
        // Poster image
        posterSrc = img.src;
      } else if (textContent) {
        // Check for video options or alt text
        if (textContent === 'autoplay') {
          videoOptions.autoplay = true;
        } else if (textContent === 'loop') {
          videoOptions.loop = true;
        } else if (textContent === 'no-controls' || textContent === 'nocontrols') {
          videoOptions.controls = false;
        } else if (textContent === 'unmuted' || textContent === 'sound') {
          videoOptions.muted = false;
        } else {
          altText = cell.textContent.trim();
        }
      }
    });
  });

  // Clear the block
  block.innerHTML = '';

  // Create video element if source exists
  if (videoSrc) {
    const alt = altText || 'Video';
    const dmType = getDMType(videoSrc);

    if (posterSrc) {
      videoOptions.poster = posterSrc;
    }

    let videoElement;

    if (dmType === 'dmOpenApi') {
      // Use DM Open API
      videoElement = createDMOpenAPIVideo(videoSrc, alt, videoOptions);
      block.classList.add('dm-open-api');
    } else if (dmType === 'scene7') {
      // Use Scene7
      videoElement = createScene7Video(videoSrc, alt, videoOptions);
      block.classList.add('dm-scene7');
    } else {
      // Standard video
      videoElement = createVideoElement(videoSrc, alt, videoOptions);
    }

    block.appendChild(videoElement);
  }
}
