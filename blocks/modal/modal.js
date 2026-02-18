import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock,
  decorateBlock,
  decorateIcons,
  loadBlock,
  loadCSS,
  loadScript,
} from '../../scripts/aem.js';

async function loadSimpleBar() {
  if (!window.SimpleBar) {
    await loadCSS('https://unpkg.com/simplebar@latest/dist/simplebar.min.css');
    await loadScript('https://unpkg.com/simplebar@latest/dist/simplebar.min.js');
  }
}

export async function createModal(contentNodes) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);

  const dialog = document.createElement('dialog');

  const dialogContent = document.createElement('div');
  dialogContent.classList.add('modal-content');
  dialogContent.append(...contentNodes);
  dialog.append(dialogContent);

  const closeButton = document.createElement('button');
  closeButton.classList.add('close-button');
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.type = 'button';
  closeButton.innerHTML = '<span class="icon icon-close"></span>';
  closeButton.addEventListener('click', () => dialog.close());
  dialog.append(closeButton);

  dialog.addEventListener('click', (event) => {
    const dialogDimensions = dialog.getBoundingClientRect();

    if (
      event.clientX < dialogDimensions.left
      || event.clientX > dialogDimensions.right
      || event.clientY < dialogDimensions.top
      || event.clientY > dialogDimensions.bottom
    ) {
      dialog.close();
    }
  });

  const block = buildBlock('modal', '');
  document.querySelector('main').append(block);
  decorateBlock(block);
  await loadBlock(block);

  decorateIcons(closeButton);

  dialog.addEventListener('close', () => block.remove());

  block.append(dialog);

  return {
    block,
    showModal: async () => {
      dialog.showModal();

      const wrappers = dialog.querySelectorAll('.otsuka-button-wrapper');

      if (wrappers.length === 2) {
        const parent = document.createElement('div');
        parent.className = 'parent-otsuka-button-wrapper';

        wrappers[0].parentNode.insertBefore(parent, wrappers[0]);
        wrappers.forEach((wrapper) => parent.appendChild(wrapper));
      }

      dialog.addEventListener('click', (e) => {
        const closeLink = e.target.closest('a[href*="#close-modal"]');
        if (!closeLink) return;

        e.preventDefault();
        dialog.close();
      });

      const secureHeading = dialog.querySelector('.modal-secure-messaging-heading');
      const secureBody = dialog.querySelector('.modal-secure-messaging-body');
      const patientPortalSection = dialog.querySelector('.external-link-popup');

      if (secureHeading) {
        closeButton.style.display = 'none';

        const closeImg = secureHeading.querySelector('picture')
          || secureHeading.querySelector('img');

        if (closeImg) {
          closeImg.style.cursor = 'pointer';

          closeImg.addEventListener('click', (ev) => {
            ev.preventDefault();
            dialog.close();
          });
        }
      }

      if (patientPortalSection) {
        closeButton.style.display = 'none';

        const closeImg = patientPortalSection.querySelector('picture')
          || patientPortalSection.querySelector('img');

        if (closeImg) {
          closeImg.style.cursor = 'pointer';

          closeImg.addEventListener('click', (ev) => {
            ev.preventDefault();
            dialog.close();
          });
        }
      }

      if (secureHeading && secureBody) {
        await loadSimpleBar();

        secureBody.style.overflow = 'auto';
        secureBody.setAttribute('data-simplebar', '');
      }

      setTimeout(() => {
        if (secureHeading && secureBody) {
          const sbWrapper = secureBody.querySelector('.simplebar-content-wrapper');
          if (sbWrapper) sbWrapper.scrollTop = 0;
        } else {
          dialogContent.scrollTop = 0;
        }
      }, 0);
    },
  };
}

export async function openModal(fragmentUrl) {
  const path = fragmentUrl.startsWith('http')
    ? new URL(fragmentUrl, window.location).pathname
    : fragmentUrl;

  const fragment = await loadFragment(path);
  const { showModal } = await createModal(fragment.childNodes);
  showModal();
}
