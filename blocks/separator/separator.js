/**
 * Separator Block - Creates a horizontal line separator
 * Supports footer-separator variant for white line styling
 */
export default async function decorate(block) {
  // Create the separator structure
  const separatorContent = document.createElement('div');
  separatorContent.className = 'separator-content';

  const separatorLine = document.createElement('div');
  separatorLine.className = 'separator-line';
  separatorLine.setAttribute('role', 'separator');
  separatorLine.setAttribute('aria-label', 'Content separator');

  separatorContent.appendChild(separatorLine);

  // Clear existing content and add separator structure
  block.innerHTML = '';
  block.appendChild(separatorContent);
}
