import { isUniversalEditorActive } from '../../scripts/scripts.js';

export default function decorate(block) {
  if (isUniversalEditorActive()) return;
  const rows = [...block.children];
  const Strong = block.querySelectorAll('strong');
  // Wrap all children of strong elements inside <nobr>
  Strong.forEach((strongElement) => {
    const nobreak = document.createElement('nobr');
    while (strongElement.firstChild) {
      nobreak.appendChild(strongElement.firstChild);
    }
    strongElement.appendChild(nobreak);
    const br = document.createElement('br');
    const parent = strongElement.parentNode;
    if (parent) parent.insertBefore(br, strongElement.nextSibling);
  });

  // Process each row to determine card type and structure
  const itemRows = rows.slice(0);
  itemRows.forEach((row) => {
    const [carddiv, imagediv, , contentdiv, buttondiv, wrawithlink] = [...row.children];
    const cardtype = carddiv.textContent.trim().toLowerCase();
    if (cardtype === 'text-only') {
      const Title = contentdiv.querySelector('p');
      const divwrap = document.createElement('div');
      divwrap.className = 'text-only-card';
      divwrap.appendChild(Title);
      row.innerHTML = '';
      block.after(divwrap);
    } else {
      const Image = imagediv.querySelector('picture');
      const Title = contentdiv.querySelector('p');
      const buttoncell = buttondiv.querySelectorAll(':scope > p');
      const isWrapWithLink = wrawithlink.textContent === 'true';

      wrawithlink.innerHTML = '';

      // Only process if we have at least 3 paragraph cells (link, text, style)
      if (buttoncell.length >= 3) {
        const buttonlinkelement = buttoncell[0].querySelector('a');
        const buttonlink = buttonlinkelement?.getAttribute('href');
        const buttonstyle = buttoncell[2].textContent.trim();
        const buttonwrap = document.createElement('a');
        buttonwrap.href = buttonlink;
        buttonwrap.innerHTML = buttoncell[1].innerHTML;
        buttonwrap.className = `button ${buttonstyle}`;
        // Clear the button div and append the new anchor
        buttondiv.innerHTML = '';

        if (isWrapWithLink) {
          const anchorwrap = document.createElement('a');
          anchorwrap.href = buttonlink;
          anchorwrap.className = 'card-link';
          if (Image) {
            anchorwrap.appendChild(Image);
          } else {
            anchorwrap.classList.add('no-image');
          }
          anchorwrap.appendChild(Title);
          anchorwrap.appendChild(buttonwrap);
          row.innerHTML = '';
          row.appendChild(anchorwrap);
        } else {
          row.appendChild(buttonwrap);
        }
      }

      carddiv.parentNode.classList.add(cardtype);
      carddiv.innerHTML = '';
    }
  });
}
