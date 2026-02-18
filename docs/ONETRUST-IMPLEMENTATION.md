# OneTrust Cookie Consent Implementation

This document describes how OneTrust cookie consent management is implemented on the Otsuka Patient Assistance site.

## Overview

OneTrust is loaded dynamically based on page metadata, allowing the domain script ID to be configured through the AEM authoring interface without code changes.

## How It Works

### 1. Configuration via Page Metadata

The OneTrust domain script ID is configured using the `onetrust-domain-script` metadata field on the homepage (`/live-content/`).

**To configure:**
1. Open the homepage in Universal Editor
2. Go to Page Properties / Metadata
3. Set the **OneTrust Domain Script ID** field to your OneTrust ID
   - Test environment: `0191114e-a4d4-7077-8d4e-2a37d6921964-test`
   - Production: Use the production ID (without `-test` suffix)

### 2. Site-Wide Application

The OneTrust configuration works site-wide from a single configuration point:

```
User visits any page (e.g., /live-content/about-us)
    ↓
Check: Does current page have onetrust-domain-script metadata?
    ↓
If YES → Use that ID
If NO  → Fetch homepage (/live-content/) and extract the ID
    ↓
Load OneTrust with the domain script ID
```

This means:
- **You only need to set the OneTrust ID once** on the homepage
- **All pages automatically inherit** the configuration
- **Individual pages can override** by setting their own `onetrust-domain-script` metadata

### 3. Script Loading

Once the domain script ID is retrieved, the OneTrust script is dynamically injected:

```html
<script 
  src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
  data-domain-script="YOUR-DOMAIN-SCRIPT-ID"
  type="text/javascript"
  charset="UTF-8"
  async>
</script>
```

## Cookie Categories

OneTrust manages consent for different cookie categories:

| Category | ID | Description |
|----------|-----|-------------|
| Strictly Necessary | C0001 | Always active, required for site functionality |
| Performance | C0002 | Analytics and performance tracking (YouTube) |
| Functional | C0003 | Enhanced functionality and personalization |
| Targeting | C0004 | Advertising and marketing |
| Social Media | C0005 | Social media integration |
| Video (Vimeo) | C0008 | Vimeo video player |

## Video Consent Integration

The site includes consent management for embedded videos:

- **YouTube videos** require `C0002` (Performance) consent
- **Vimeo videos** require `C0008` (Social Media/Video) consent

When a user hasn't consented to the required category, they see a placeholder with a "Cookie settings" button to manage their preferences.

## Files Involved

| File | Purpose |
|------|---------|
| `scripts/scripts.js` | Main OneTrust loading logic |
| `blocks/video/consent-management-video.js` | Video-specific consent handling |
| `blocks/video/consent-management-media.js` | Media consent utilities |
| `models/_page.json` | Universal Editor metadata field definition |
| `head.html` | Contains comment noting OneTrust is loaded dynamically |

## Key Functions

### `getOneTrustDomainScript()` (scripts.js)

Retrieves the OneTrust domain script ID:
1. Checks current page metadata first
2. Falls back to fetching from homepage (`/live-content/`)
3. Caches the result for subsequent calls

### `loadOneTrust(domainScriptId)` (scripts.js)

Dynamically loads the OneTrust script with the provided domain script ID.

## Testing

### Local Development

When running locally (`localhost`), OneTrust will load but the consent banner behavior depends on your OneTrust configuration.

### Verify OneTrust is Loading

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "onetrust" or "otSDKStub"
4. Refresh the page
5. You should see the OneTrust script loading

### Check the Domain Script ID

In the browser console, run:
```javascript
document.querySelector('script[src*="otSDKStub"]')?.getAttribute('data-domain-script')
```

This returns the domain script ID being used.

## Changing Environments

To switch between test and production OneTrust configurations:

1. Open the homepage (`/live-content/`) in Universal Editor
2. Edit the **OneTrust Domain Script ID** metadata field
3. Save and publish the page

| Environment | Domain Script ID |
|-------------|------------------|
| Test/Staging | `0191114e-a4d4-7077-8d4e-2a37d6921964-test` |
| Production | `0191114e-a4d4-7077-8d4e-2a37d6921964` (without `-test`) |

## Troubleshooting

### OneTrust not loading

1. Check that the homepage has `onetrust-domain-script` metadata set
2. Verify the domain script ID is correct
3. Check browser console for errors
4. Ensure the OneTrust domain is whitelisted in your OneTrust account

### Consent banner not appearing

1. You may have already consented (check cookies)
2. Clear cookies and refresh
3. Verify the OneTrust account has the consent banner enabled for your domain

### Videos not playing after consent

1. Check that the correct cookie category is consented
2. Refresh the page after giving consent
3. Verify the video URL is valid and accessible

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Page Load                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              scripts.js - loadEager()                       │
│                                                             │
│  1. Call getOneTrustDomainScript()                          │
│     - Check current page metadata                           │
│     - If not found, fetch from /live-content/               │
│                                                             │
│  2. Call loadOneTrust(domainScriptId)                       │
│     - Inject OneTrust script into <head>                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   OneTrust SDK Loads                        │
│                                                             │
│  - Displays consent banner (if needed)                      │
│  - Manages cookie preferences                               │
│  - Fires consent events                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Video Blocks Check Consent                     │
│                                                             │
│  consent-management-video.js                                │
│  - Checks OneTrust consent for video category               │
│  - Shows placeholder if not consented                       │
│  - Loads video player if consented                          │
└─────────────────────────────────────────────────────────────┘
```
