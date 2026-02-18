import { moveInstrumentation } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

// Helper function to identify if this is a configuration value
function isConfigurationValue(text) {
  const configValues = [
    'dark', 'light', 'compact', 'centered', 'wide', 'narrow',
    'true', 'false', 'enabled', 'disabled',
    'left', 'right', 'top', 'bottom',
  ];
  return configValues.includes(text.toLowerCase());
}

function isFirstNonConfigRow(currentIndex, allRows) {
  for (let i = 0; i < allRows.length; i += 1) {
    const row = allRows[i];
    const cells = [...row.children];
    if (cells.length > 0) {
      const cellText = cells[0].textContent.trim();
      if (cellText && !isConfigurationValue(cellText)) {
        return i === currentIndex; // This is the first content row
      }
    }
  }
  return false;
}

// Helper function to identify container-level content
function isContainerContent(cell, currentIndex, allRows) {
  const textContent = cell.textContent.trim();

  // Empty cells are not container content
  if (!textContent) return false;

  // Configuration values are not container content
  if (isConfigurationValue(textContent)) return false;

  // First non-config row is likely container content (main heading)
  return isFirstNonConfigRow(currentIndex, allRows);
}

// Helper function to determine if row should be processed as child item
function shouldProcessAsChildItem(cell, index, allRows) {
  const textContent = cell.textContent.trim();

  // Skip empty rows
  if (!textContent && !cell.querySelector('img') && !cell.querySelector('a')) {
    return false;
  }

  // Skip configuration values
  if (isConfigurationValue(textContent)) {
    return false;
  }

  // Skip container content (main heading)
  if (isContainerContent(cell, index, allRows)) {
    return false;
  }

  // Process EVERYTHING else as potential child items
  // Don't be restrictive - let the item processing handle edge cases
  return true;
}

// Extract card data from a table row - follows model field order
function extractCardData(element, row) {
  const cardData = {
    cardImage: null,
    cardImageAlt: '',
    cardHeading: '',
    cardBody: '',
  };

  const cells = [...row.children];

  // Process cells in order to match JSON model field sequence
  // Model order: cardImage, cardImageAlt, cardHeading, cardBody
  cells.forEach((cell) => {
    const content = cell.innerHTML.trim();
    const textContent = cell.textContent.trim();
    const img = cell.querySelector('img');
    const link = cell.querySelector('a');

    // Map to model fields based on cell content type, preserving order
    if (img && img.src) {
      cardData.cardImage = img;
      cardData.cardImageAlt = img.alt || '';
    } else if (textContent && !img && !link) {
      // First text cell becomes heading, second becomes body
      if (!cardData.cardHeading) {
        cardData.cardHeading = content;
      } else if (!cardData.cardBody) {
        cardData.cardBody = content;
      }
    }
  });

  return cardData;
}

// Validate field order matches model definition
function validateFieldOrder(extractedData) {
  const expectedFields = ['cardImage', 'cardImageAlt', 'cardHeading', 'cardBody'];

  // Ensure all expected fields are present (even if empty)
  expectedFields.forEach((fieldName) => {
    if (!(fieldName in extractedData)) {
      extractedData[fieldName] = fieldName === 'cardImage' ? null : '';
    }
  });

  return extractedData;
}

// Create a card element
function createCardElement(cardData, index, originalRow = null) {
  const cardContainer = document.createElement('div');
  cardContainer.className = 'tab-card';

  // Move Universal Editor instrumentation to preserve editing capabilities
  if (originalRow) {
    moveInstrumentation(originalRow, cardContainer);
  }

  // Validate and ensure all fields are present
  const safeCardData = validateFieldOrder(cardData || {
    cardImage: null,
    cardImageAlt: '',
    cardHeading: '',
    cardBody: '',
  });

  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'tab-card-image';

  if (safeCardData.cardImage) {
    // Create optimized picture element for responsive images
    const optimizedPic = createOptimizedPicture(
      safeCardData.cardImage.src,
      safeCardData.cardImageAlt || safeCardData.cardHeading || 'Card image',
      false, // eager loading for above-the-fold content
      [{ width: '600' }], // breakpoint configuration for cards
    );
    imageContainer.appendChild(optimizedPic);
  } else {
    // Empty placeholder for Universal Editor
    imageContainer.setAttribute('data-placeholder', 'Add image...');
  }

  // Create text container
  const textContainer = document.createElement('div');
  textContainer.className = 'tab-card-text';

  // Create heading element
  const headingElement = document.createElement('h6');
  if (safeCardData.cardHeading) {
    headingElement.innerHTML = safeCardData.cardHeading;
  } else {
    headingElement.innerHTML = '';
    headingElement.setAttribute('data-placeholder', 'Add heading...');
  }

  // Create body element
  const bodyElement = document.createElement('p');
  if (safeCardData.cardBody) {
    bodyElement.innerHTML = safeCardData.cardBody;
  } else {
    bodyElement.innerHTML = '';
    bodyElement.setAttribute('data-placeholder', 'Add body text...');
  }

  textContainer.appendChild(headingElement);
  textContainer.appendChild(bodyElement);

  cardContainer.appendChild(imageContainer);
  cardContainer.appendChild(textContainer);

  return cardContainer;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const container = document.createElement('div');
  container.className = 'tab-cards-container';

  const containerContent = [];
  const childItems = [];
  const configurationValues = [];

  // Categorize rows properly
  rows.forEach((row, index) => {
    const cells = [...row.children];
    if (!cells.length) return;

    const cell = cells[0];
    const textContent = cell.textContent.trim();

    // Check for configuration values first
    if (isConfigurationValue(textContent)) {
      configurationValues.push({ value: textContent.toLowerCase(), row });
      return;
    }

    // Check for container-level content (main heading)
    if (isContainerContent(cell, index, rows)) {
      containerContent.push({ content: cell.innerHTML.trim(), row });
      return;
    }

    // Process ALL remaining non-configuration rows as child items
    if (shouldProcessAsChildItem(cell, index, rows)) {
      childItems.push({ element: row, row, index });
    }
  });

  // Process container content first
  if (containerContent.length > 0) {
    const header = document.createElement('div');
    header.className = 'tab-cards-header';
    const h2 = document.createElement('h2');
    h2.innerHTML = containerContent[0].content;
    header.appendChild(h2);
    container.appendChild(header);

    // Clean up container content rows
    containerContent.forEach(({ row }) => row.remove());
  }

  // Create content container
  const content = document.createElement('div');
  content.className = 'tab-cards-content';

  // Process child items in DOM order
  childItems.forEach((item, index) => {
    const itemData = extractCardData(item.element, item.row);
    const itemElement = createCardElement(itemData, index, item.row);
    content.appendChild(itemElement);
    item.row.remove();
  });

  // Apply configuration values
  configurationValues.forEach(({ value, row }) => {
    if (['dark', 'light', 'compact', 'centered', 'wide', 'narrow'].includes(value)) {
      block.classList.add(value);
    }
    row.remove();
  });

  container.appendChild(content);
  block.appendChild(container);
}
