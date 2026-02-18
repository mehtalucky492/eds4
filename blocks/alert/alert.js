/**
 * Finds phone numbers in text and wraps them with a span for styling.
 * Supports formats like: 1-855-727-6274, (855) 727-6274, 855.727.6274, 8557276274
 * @param {string} text - The text to search for phone numbers
 * @returns {string} HTML string with phone numbers wrapped in spans
 */
function highlightPhoneNumbers(text) {
  // Regex to match common phone number formats
  // Matches: 1-855-727-6274, (855) 727-6274, 855.727.6274, 855-727-6274, 8557276274
  const phoneRegex = /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;

  return text.replace(phoneRegex, '<span class="alert-phone-number">$&</span>');
}

export default function decorate(block) {
  // Get the alert text and style from the block's children
  const rows = [...block.children];

  // The first row contains the alert text (and potentially an icon)
  const alertTextRow = rows[0];

  // The second row contains the style selection (if present)
  const alertStyleRow = rows[1];
  const alertStyle = alertStyleRow?.textContent?.trim();

  // The third row contains the phone number for mobile (if present)
  const phoneNumberRow = rows[2];
  const phoneNumberMobile = phoneNumberRow?.textContent?.trim();

  // Store phone number as data attribute for header to access
  if (phoneNumberMobile) {
    block.setAttribute('data-phone-number-mobile', phoneNumberMobile);
  }

  // Clear the block content
  block.innerHTML = '';

  // Add the style as a class if it's not empty/default
  if (alertStyle && alertStyle !== '' && alertStyle !== 'default') {
    block.classList.add(alertStyle);
  }

  // Create the alert content container
  const alertContent = document.createElement('div');
  alertContent.className = 'alert-content';

  const alertText = document.createElement('p');
  alertText.className = 'alert-text';

  // Check if there's an icon in the authored content
  const icon = alertTextRow?.querySelector('img');
  if (icon) {
    const iconName = icon.dataset?.iconName || icon.alt || 'phone-without-bg';
    const iconSrc = icon.src || icon.getAttribute('src');
    alertText.classList.add(`icon-${iconName}--before`);

    // Set the icon as a CSS custom property so ::before can use it
    if (iconSrc) {
      alertText.style.setProperty('--icon-url', `url(${iconSrc})`);
    }
  }

  // Get the text content (without the image)
  const textContent = Array.from(alertTextRow?.childNodes || [])
    .filter((node) => node.nodeType === Node.TEXT_NODE
      || (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'IMG'))
    .map((node) => node.textContent)
    .join('')
    .trim();

  // Apply phone number highlighting and set as innerHTML
  alertText.innerHTML = highlightPhoneNumbers(textContent);
  alertContent.appendChild(alertText);

  // Create a wrapper for the ticker animation
  const tickerWrapper = document.createElement('div');
  tickerWrapper.className = 'alert-ticker-wrapper';

  // Clone the content for seamless loop
  const alertContentClone = alertContent.cloneNode(true);
  alertContentClone.className = 'alert-content alert-content-clone';

  tickerWrapper.appendChild(alertContent);
  tickerWrapper.appendChild(alertContentClone);

  // Append the wrapper to the block
  block.appendChild(tickerWrapper);
}
