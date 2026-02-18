/* eslint-disable linebreak-style */
import { moveInstrumentation } from '../../scripts/scripts.js';

// Remove highlight marks
function removeHighlights(element) {
  const marks = element.querySelectorAll('mark.search-highlight');
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

// Add yellow highlight around matching text
function highlightText(element, searchTerm) {
  if (!searchTerm || searchTerm.length < 3) return;

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false,
  );

  const nodesToReplace = [];
  let node = walker.nextNode();

  while (node) {
    if (node.parentElement.tagName !== 'MARK' && node.textContent.trim()) {
      nodesToReplace.push(node);
    }
    node = walker.nextNode();
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

  nodesToReplace.forEach((textNode) => {
    const text = textNode.textContent;
    if (regex.test(text)) {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      text.replace(regex, (match, ...args) => {
        const offset = args[args.length - 2];
        if (offset > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }
        const mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.textContent = match;
        fragment.appendChild(mark);
        lastIndex = offset + match.length;
        return match;
      });
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}

// Search and filter accordion items across all tabs
function performSearch(searchTerm, section, noResultsMessage) {
  const accordions = section.querySelectorAll('.accordion[id]');
  if (!accordions.length) return;

  const term = searchTerm.trim().toLowerCase();

  // Less than 3 chars: show all items
  if (term.length < 3) {
    accordions.forEach((accordion) => {
      const items = accordion.querySelectorAll('.accordion-item');
      items.forEach((item, index) => {
        item.classList.remove('search-hidden');
        item.style.display = '';

        const numberSpan = item.querySelector('.accordion-number');
        if (numberSpan) {
          numberSpan.textContent = String(index + 1).padStart(2, '0');
        }

        const btnText = item.querySelector('.button-text');
        const body = item.querySelector('.accordion-body');
        if (btnText) removeHighlights(btnText);
        if (body) removeHighlights(body);
      });
    });
    noResultsMessage.style.display = 'none';
    section.classList.remove('no-search-results');
    return;
  }

  // Filter and highlight
  let totalMatches = 0;

  accordions.forEach((accordion) => {
    const items = accordion.querySelectorAll('.accordion-item');
    let visibleIndex = 0;

    items.forEach((item) => {
      const btnText = item.querySelector('.button-text');
      const body = item.querySelector('.accordion-body');

      if (btnText) removeHighlights(btnText);
      if (body) removeHighlights(body);

      const questionText = btnText?.textContent?.toLowerCase() || '';
      const answerText = body?.textContent?.toLowerCase() || '';
      const isMatch = questionText.includes(term) || answerText.includes(term);

      if (isMatch) {
        item.classList.remove('search-hidden');
        item.style.display = '';
        totalMatches += 1;

        const numberSpan = item.querySelector('.accordion-number');
        if (numberSpan) {
          numberSpan.textContent = String(visibleIndex + 1).padStart(2, '0');
        }
        visibleIndex += 1;

        if (btnText && questionText.includes(term)) {
          highlightText(btnText, term);
        }
        if (body && answerText.includes(term)) {
          highlightText(body, term);
        }
      } else {
        item.classList.add('search-hidden');
        item.style.display = 'none';
      }
    });
  });

  // Show "No Results" only if no matches across all tabs
  noResultsMessage.style.display = totalMatches === 0 ? 'block' : 'none';

  if (totalMatches === 0) {
    section.classList.add('no-search-results');
  } else {
    section.classList.remove('no-search-results');
  }
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const searchIconRow = rows[0];
  const clearIconRow = rows[1];
  const noResultIconRow = rows[2];
  const placeholderRow = rows[3];
  const suggestionsRow = rows[4];
  const noResultRow = rows[5];

  const searchIconImg = searchIconRow?.querySelector('img');
  const searchIconSrc = searchIconImg?.src || '';
  const searchIconAlt = searchIconImg?.alt || 'Search';

  const clearIconImg = clearIconRow?.querySelector('img');
  const clearIconSrc = clearIconImg?.src || '';
  const clearIconAlt = clearIconImg?.alt || 'Clear';

  const noResultIconImg = noResultIconRow?.querySelector('img');
  const noResultIconSrc = noResultIconImg?.src || '';
  const noResultIconAlt = noResultIconImg?.alt || 'Error';

  const placeholderText = placeholderRow?.textContent?.trim() || 'Search...';
  const noResultText = noResultRow?.textContent?.trim() || 'No Result Found';

  const searchContainer = document.createElement('div');
  searchContainer.className = 'faq-search-input-container';

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'faq-search-input-wrapper';

  const searchIcon = document.createElement('span');
  searchIcon.className = 'faq-search-icon';
  if (searchIconSrc) {
    const img = document.createElement('img');
    img.src = searchIconSrc;
    img.alt = searchIconAlt;
    searchIcon.appendChild(img);
  }
  searchIcon.setAttribute('aria-hidden', 'true');
  searchIcon.style.cursor = 'pointer';
  searchIcon.setAttribute('role', 'button');
  searchIcon.setAttribute('tabindex', '0');
  searchIcon.setAttribute('aria-label', 'Search');

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'faq-search-input';
  searchInput.placeholder = placeholderText;
  searchInput.setAttribute('role', 'combobox');
  searchInput.setAttribute('aria-label', 'Search FAQs');
  searchInput.setAttribute('aria-expanded', 'false');
  searchInput.setAttribute('aria-autocomplete', 'list');

  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'faq-search-clear';
  if (clearIconSrc) {
    const img = document.createElement('img');
    img.src = clearIconSrc;
    img.alt = clearIconAlt;
    clearButton.appendChild(img);
  }
  clearButton.setAttribute('aria-label', 'Clear search');
  clearButton.style.display = 'none';

  searchWrapper.append(searchIcon, searchInput, clearButton);

  const suggestionsDropdown = document.createElement('div');
  suggestionsDropdown.className = 'faq-suggestions-dropdown';
  suggestionsDropdown.setAttribute('role', 'listbox');
  suggestionsDropdown.style.display = 'none';

  if (suggestionsRow) {
    const suggestionsContent = suggestionsRow.querySelector('div');
    const heading = suggestionsContent?.querySelector('p');
    const list = suggestionsContent?.querySelector('ul');

    if (heading) {
      const dropdownHeading = document.createElement('div');
      dropdownHeading.className = 'suggestions-heading';
      dropdownHeading.textContent = heading.textContent.trim();
      suggestionsDropdown.appendChild(dropdownHeading);
    }

    if (list) {
      const suggestionsList = document.createElement('ul');
      suggestionsList.className = 'suggestions-list';

      const items = list.querySelectorAll('li');
      items.forEach((item) => {
        const suggestionItem = document.createElement('li');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.setAttribute('role', 'option');

        const suggestionText = document.createElement('span');
        suggestionText.className = 'suggestion-text';
        suggestionText.textContent = item.textContent.trim();

        const suggestionIcon = document.createElement('span');
        suggestionIcon.className = 'suggestion-icon';
        if (searchIconSrc) {
          const img = document.createElement('img');
          img.src = searchIconSrc;
          img.alt = searchIconAlt;
          suggestionIcon.appendChild(img);
        }
        suggestionIcon.setAttribute('aria-hidden', 'true');

        suggestionItem.append(suggestionText, suggestionIcon);
        suggestionsList.appendChild(suggestionItem);

        moveInstrumentation(item, suggestionItem);
      });

      suggestionsDropdown.appendChild(suggestionsList);
    }

    moveInstrumentation(suggestionsContent, suggestionsDropdown);
  }

  const noResultsMessage = document.createElement('div');
  noResultsMessage.className = 'faq-no-results';
  noResultsMessage.style.display = 'none';

  const noResultIcon = document.createElement('span');
  noResultIcon.className = 'no-results-icon';
  if (noResultIconSrc) {
    const img = document.createElement('img');
    img.src = noResultIconSrc;
    img.alt = noResultIconAlt;
    noResultIcon.appendChild(img);
  }
  noResultIcon.setAttribute('aria-hidden', 'true');

  const noResultTextElement = document.createElement('span');
  noResultTextElement.className = 'no-results-text';
  noResultTextElement.textContent = noResultText;

  noResultsMessage.append(noResultIcon, noResultTextElement);

  if (noResultRow) {
    moveInstrumentation(noResultRow, noResultsMessage);
  }

  if (searchIconRow) {
    moveInstrumentation(searchIconRow, searchIcon);
  }
  if (clearIconRow) {
    moveInstrumentation(clearIconRow, clearButton);
  }
  if (noResultIconRow) {
    moveInstrumentation(noResultIconRow, noResultIcon);
  }

  searchContainer.append(searchWrapper, suggestionsDropdown);
  block.textContent = '';
  block.appendChild(searchContainer);

  const section = block.closest('.section');
  if (section) {
    section.appendChild(noResultsMessage);
  }

  const triggerSearch = () => {
    const searchTerm = searchInput.value.trim();
    suggestionsDropdown.style.display = 'none';
    searchInput.setAttribute('aria-expanded', 'false');
    performSearch(searchTerm, section, noResultsMessage);
  };

  searchInput.addEventListener('input', () => {
    clearButton.style.display = searchInput.value ? 'block' : 'none';
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    clearButton.style.display = 'none';
    suggestionsDropdown.style.display = 'block';
    searchInput.setAttribute('aria-expanded', 'true');
    searchInput.focus();
    performSearch('', section, noResultsMessage);
  });

  searchInput.addEventListener('focus', () => {
    if (!searchInput.value) {
      suggestionsDropdown.style.display = 'block';
      searchInput.setAttribute('aria-expanded', 'true');
    }
  });

  setTimeout(() => {
    document.addEventListener('click', (e) => {
      if (!searchContainer.contains(e.target)) {
        suggestionsDropdown.style.display = 'none';
        searchInput.setAttribute('aria-expanded', 'false');
      }
    });
  }, 0);

  searchInput.addEventListener('input', () => {
    const { value } = searchInput;
    if (value) {
      suggestionsDropdown.style.display = 'none';
      searchInput.setAttribute('aria-expanded', 'false');
    } else {
      suggestionsDropdown.style.display = 'block';
      searchInput.setAttribute('aria-expanded', 'true');
      performSearch('', section, noResultsMessage);
    }
  });

  searchIcon.addEventListener('click', triggerSearch);

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch();
    } else if (e.key === 'Escape') {
      suggestionsDropdown.style.display = 'none';
      searchInput.setAttribute('aria-expanded', 'false');
    }
  });

  const suggestionItems = suggestionsDropdown.querySelectorAll('.suggestion-item');
  suggestionItems.forEach((item) => {
    item.addEventListener('click', () => {
      const text = item.querySelector('.suggestion-text').textContent;
      searchInput.value = text;
      clearButton.style.display = 'block';
      searchInput.focus();
      triggerSearch();
    });
  });

  window.addEventListener('hashchange', () => {
    const currentSearch = searchInput.value.trim();
    if (currentSearch && currentSearch.length >= 3) {
      setTimeout(() => {
        performSearch(currentSearch, section, noResultsMessage);
      }, 100);
    }
  });
}
