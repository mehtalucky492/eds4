# Otsuka AEM-codekit Boilerplate
Starter project for Otsuka AEM-codekit 

## Environments
- Preview: https://main--otsuka-codekit-boilerplate--oapi-commercial-omni.aem.page/
- Live: https://main--otsuka-codekit-boilerplate--oapi-commercial-omni.aem.live/
- Prod Preview: https://main--otsuka-codekit-otsukapa--oapi-commercial-omni.aem.page/
- Prod Live: https://main--otsuka-codekit-otsukapa--oapi-commercial-omni.aem.live/
- QA Preview: https://qa--otsuka-codekit-otsukapa-qa--oapi-commercial-omni.aem.page/
- QA Live: https://qa--otsuka-codekit-otsukapa-qa--oapi-commercial-omni.aem.live/
- DEV Preview: https://dev--otsuka-codekit-otsukapa-dev--oapi-commercial-omni.aem.page/
- DEV Live: https://dev--otsuka-codekit-otsukapa-dev--oapi-commercial-omni.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on [www.aem.live](https://www.aem.live/docs/) and [experienceleague.adobe.com](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/authoring), more specifically:
1. [Getting Started](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/edge-dev-getting-started), [Creating Blocks](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/create-block), [Content Modelling](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/content-modeling)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

Furthremore, we encourage you to watch the recordings of any of our previous presentations or sessions:
- [Getting started with AEM Authoring and Edge Delivery Services](https://experienceleague.adobe.com/en/docs/events/experience-manager-gems-recordings/gems2024/aem-authoring-and-edge-delivery)

## Prerequisites

- nodejs 18.3.x or newer
- AEM Cloud Service release 2024.8 or newer (>= `17465`)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-codekit-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `aem-codekit-boilerplate` directory in your favorite IDE and start coding :)

## Theming

This project supports custom themes that allow you to override default styles on a per-page or site-wide basis.

### How Themes Work

Themes are CSS files located in the `/styles/themes/` directory. When a page specifies a theme via metadata, the corresponding theme CSS file is automatically loaded and the theme name is added as a class to the `<body>` element.

### Adding a New Theme

1. Create a new CSS file in `/styles/themes/` with your theme name (e.g., `/styles/themes/my-theme.css`)
2. Override any CSS variables or styles from `styles.css` or `root.css` in your theme file
3. Use the theme name class (e.g., `body.my-theme`) for theme-specific overrides

### Applying a Theme to a Single Page 

To apply a theme to a single page:

1. Open the page in **Universal Editor**
2. In the right-side **Page Properties** panel, locate the **Theme** field
3. Enter your theme name (e.g., `demo`)
4. Click **Publish** to publish the page

The theme CSS will be automatically loaded and applied to that page only.

### Applying a Theme Site-Wide

To apply a theme across the entire site:

1. Navigate to your site's root folder in AEM
2. Open or create a metadata configuration file
3. Add the `theme` metadata with your desired theme name
4. All pages inheriting from this configuration will use the specified theme

### Example Theme File

```css
/**
 * Custom Theme
 * /styles/themes/my-theme.css
 */

:root {
  /* Override colors */
  --background-color: #f5f5f5;
  --text-color: #2c3e50;
  --link-color: #e74c3c;
}

body.my-theme {
  /* Theme-specific styles */
}
```
