import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const [contentDiv, buttonDiv, imagesDiv] = [...block.children];

  const contentCell = contentDiv.querySelector(':scope > div');

  const buttonCell = buttonDiv.querySelector(':scope > div');
  const buttonParas = buttonCell?.querySelectorAll(':scope > p') || [];

  const buttonText = buttonParas[0]?.textContent.trim();
  const buttonLinkElement = buttonParas[1]?.querySelector('a');
  const buttonLink = buttonLinkElement?.getAttribute('href');
  const buttonTarget = buttonParas[2]?.textContent.trim() || '_self';
  const buttonIcon = buttonParas[3]?.querySelector('picture, img');

  const imagesCell = imagesDiv.querySelector(':scope > div');
  const imagePictures = imagesCell?.querySelectorAll(':scope > p > picture') || [];

  const desktopImage = imagePictures[0];
  const mobileImage = imagePictures[1];

  const contentSection = document.createElement('div');
  contentSection.className = 'hero-banner__content';

  if (contentCell) {
    moveInstrumentation(contentCell, contentSection);

    const paragraphs = contentCell.querySelectorAll('p');
    if (paragraphs.length > 1) {
      contentSection.classList.add('alternate');
    }

    const title = contentCell.querySelector('h1');
    if (title) {
      title.className = 'hero-banner__title';
    }

    const description = contentCell.querySelector('p');
    if (description) {
      description.className = 'hero-banner__description';
    }

    contentSection.appendChild(contentCell);
  }

  if (buttonText && buttonLink) {
    const button = document.createElement('a');
    button.href = buttonLink;
    button.target = buttonTarget;
    button.className = 'hero-banner__button';

    const buttonTextSpan = document.createElement('span');
    buttonTextSpan.className = 'hero-banner__button-text';
    buttonTextSpan.textContent = buttonText;
    button.appendChild(buttonTextSpan);

    if (buttonIcon) {
      const buttonIconSpan = document.createElement('span');
      buttonIconSpan.className = 'hero-banner__button-icon';

      const iconImg = buttonIcon.tagName === 'IMG' ? buttonIcon : buttonIcon.querySelector('img');
      if (iconImg) {
        const imgClone = iconImg.cloneNode(true);
        buttonIconSpan.appendChild(imgClone);
        button.appendChild(buttonIconSpan);
      }
    }
    contentSection.appendChild(button);
  }

  const imagesSection = document.createElement('div');
  imagesSection.className = 'hero-banner__images';

  const paragraphs = contentCell?.querySelectorAll('p');
  if (paragraphs && paragraphs.length > 1) {
    imagesSection.classList.add('alternate');
  }

  if (mobileImage) {
    const mobileImg = mobileImage.querySelector('img');
    if (mobileImg) {
      const mobileDiv = document.createElement('div');
      mobileDiv.className = 'hero-banner__image hero-banner__image--mobile';
      const imgClone = mobileImg.cloneNode(true);
      mobileDiv.appendChild(imgClone);
      imagesSection.appendChild(mobileDiv);
    }
  }

  if (desktopImage) {
    const desktopImg = desktopImage.querySelector('img');
    if (desktopImg) {
      const desktopDiv = document.createElement('div');
      desktopDiv.className = 'hero-banner__image hero-banner__image--desktop';
      const imgClone = desktopImg.cloneNode(true);
      desktopDiv.appendChild(imgClone);
      imagesSection.appendChild(desktopDiv);
    }
  }

  block.innerHTML = '';
  block.appendChild(contentSection);
  block.appendChild(imagesSection);
}
