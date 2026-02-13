// add delayed functionality here
import { decorateExternalLinks } from './aem.js';

// Load consent management
import initOneTrust from './consent-management.js';

import('./consent-management-video.js');

initOneTrust();

decorateExternalLinks(document.querySelector('body'));
