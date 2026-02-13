/**
 * Decorates the otsuka-button block
 * @param {Element} block The otsuka-button block element
 */
export default function decorate(block) {
  // Get all the divs in the block (Franklin renders model fields as divs)
  const children = Array.from(block.children);

  // Extract data from the block structure
  let link = '';
  let buttonText = '';
  let buttonTitle = '';
  let buttonStyle = '';

  children.forEach((div) => {
    const text = div.textContent.trim();
    const anchor = div.querySelector('a');

    if (anchor) {
      // First div with anchor is the link field
      link = anchor.href;
    } else if (text && !buttonText) {
      // First text div is buttonText
      buttonText = text;
    } else if (text && buttonText && !buttonTitle) {
      // Second text div is buttonTitle
      buttonTitle = text;
    } else if (text && buttonText && buttonTitle && !buttonStyle) {
      // Third text div is buttonStyle
      buttonStyle = text;
    }
  });

  // Clear the block content
  block.innerHTML = '';

  // Create the button element
  if (link && buttonText) {
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.textContent = buttonText;
    anchor.classList.add('button');

    if (buttonTitle) {
      anchor.title = buttonTitle;
    }

    // Add the button style class if provided
    if (buttonStyle) {
      anchor.classList.add(buttonStyle);
    }

    block.appendChild(anchor);
  }
}
