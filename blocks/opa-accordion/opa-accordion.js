/* eslint-disable linebreak-style */
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Config rows
  const headingRow = rows[0];
  const idRow = rows[1];
  const openIconRow = rows[2];
  const closeIconRow = rows[3];
  const itemRows = rows.slice(4);

  const heading = headingRow?.textContent?.trim() || '';
  const accordionId = idRow?.textContent?.trim() || '';
  const openIcon = openIconRow?.querySelector('picture')?.cloneNode(true);
  const closeIcon = closeIconRow?.querySelector('picture')?.cloneNode(true);

  const accordion = document.createElement('div');
  accordion.className = 'accordion';
  if (accordionId) accordion.id = accordionId;

  if (heading) {
    const h3 = document.createElement('h3');
    h3.className = 'accordion-heading';
    h3.textContent = heading;
    accordion.appendChild(h3);
  }

  itemRows.forEach((row, index) => {
    const [questionCol, answerCol] = row.children;
    if (!questionCol || !answerCol) return;

    const item = document.createElement('div');
    item.className = 'accordion-item';

    const header = document.createElement('div');
    header.className = 'accordion-header';

    const button = document.createElement('button');
    button.className = 'accordion-button collapsed';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-expanded', 'false');

    const number = document.createElement('span');
    number.className = 'accordion-number';
    number.textContent = String(index + 1).padStart(2, '0');
    button.appendChild(number);

    const btnText = document.createElement('div');
    btnText.className = 'button-text';
    btnText.textContent = questionCol.textContent.trim();
    button.appendChild(btnText);

    // Icons
    if (openIcon) {
      const open = openIcon.cloneNode(true);
      open.className = 'accordion-icon accordion-icon-open';
      button.appendChild(open);
    }
    if (closeIcon) {
      const close = closeIcon.cloneNode(true);
      close.className = 'accordion-icon accordion-icon-close';
      button.appendChild(close);
    }

    header.appendChild(button);

    const collapse = document.createElement('div');
    collapse.className = 'accordion-collapse';

    const body = document.createElement('div');
    body.className = 'accordion-body';
    body.innerHTML = answerCol.innerHTML;

    collapse.appendChild(body);
    item.append(header, collapse);
    accordion.appendChild(item);

    // Attributes for Universal Editor
    moveInstrumentation(row, item);
    moveInstrumentation(questionCol, btnText);
    moveInstrumentation(answerCol, body);

    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') === 'true';

      // Close all items
      accordion.querySelectorAll('.accordion-button').forEach((btn) => {
        btn.classList.add('collapsed');
        btn.setAttribute('aria-expanded', 'false');
        const otherCollapse = btn.closest('.accordion-item').querySelector('.accordion-collapse');
        otherCollapse.style.height = '0';
        otherCollapse.classList.remove('show');
      });

      // Open current
      if (!isOpen) {
        button.classList.remove('collapsed');
        button.setAttribute('aria-expanded', 'true');
        collapse.classList.add('show');
        collapse.style.height = `${collapse.scrollHeight}px`;
      }
    });
  });

  block.textContent = '';
  block.appendChild(accordion);
}
