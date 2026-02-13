# AEM Content Modeling Reference Guide

## Content Model Structure Overview

### Block Types
1. **Default Content**: Self-explanatory content (text, headings, links, images)
   - Text: Rich text including list elements and formatting
   - Title: Text with heading type (h1-h6)
   - Image: Source and description
   - Button: Text, title, URL, type (default, primary, secondary)

2. **Blocks**: Richer content with specific styles and functionality
   - Require explicit modeling for the authoring interface
   - Rendered as table-like structures in the DOM

### Model Components

#### Block Definition

##### Simple Block Definition
```json
"definitions": [
{
  "title": "Hero",
  "id": "hero",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Hero",
          "model": "hero"
        }
      }
    }
  }
}
],
```

##### Key-Value Block Definition
```json
"definitions": [
      {
        "title": "FAQs",
        "id": "faqs",
        "plugins": {
          "xwalk": {
            "page": {
              "resourceType": "core/franklin/components/block/v1/block",
              "template": {
                "name": "FAQs",
                "model": "faqs",
                "filter": "faqs"
              }
            }
          }
        }
      }
    ],
```

##### Container Block Definition
```json
  "definitions": [
    {
      "title": "Cards",
      "id": "cards",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "Cards",
              "filter": "cards"
            }
          }
        }
      }
    },
    {
      "title": "Card",
      "id": "card",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block/item",
            "template": {
              "name": "Card",
              "model": "card"
            }
          }
        }
      }
    }
  ],

#### Block Model

##### Simple Block Model
```json
{
  "id": "hero",
  "fields": [
    {
      "component": "reference",
      "valueType": "string",
      "name": "image",
      "label": "Image",
      "multi": false
    },
    {
      "component": "text",
      "valueType": "string",
      "name": "imageAlt",
      "label": "Alt",
      "value": ""
    },
    {
      "component": "richtext",
      "name": "heroInfo",
      "value": "",
      "label": "Hero Information",
      "valueType": "string"
    }
  ]
}
```

##### Simple Block Model with Container Fields
```json
{
  "id": "testimonial",
  "fields": [
    {
      "component": "reference",
      "valueType": "string",
      "name": "image",
      "label": "Profile Image",
      "multi": false
    },
    {
      "component": "text",
      "valueType": "string",
      "name": "imageAlt",
      "label": "Image Alt Text"
    },
    {
      "component": "richtext",
      "valueType": "string",
      "name": "quote",
      "label": "Testimonial Quote"
    },
    {
      "component": "container",
      "name": "authorContainer",
      "label": "Author Container",
      "collapsible": true,
      "description": "Author information group",
      "fields": [
        {
          "component": "text",
          "valueType": "string",
          "name": "authorName",
          "label": "Author Name",
          "required": true
        },
        {
          "component": "text",
          "valueType": "string",
          "name": "authorPosition",
          "label": "Author Position"
        },
        {
          "component": "text",
          "valueType": "string",
          "name": "authorCompany",
          "label": "Author Company"
        }
      ]
    }
  ]
}
```

##### Key-Value Block Model
```json
"models": [
      {
        "id": "faqs",
        "fields": [
          {
            "component": "text",
            "valueType": "string",
            "name": "dataSource",
            "value": "/faq",
            "label": "Data Source Path"
          },
          {
            "component": "number",
            "valueType": "number",
            "name": "displayColumns",
            "value": 1,
            "label": "Display Columns"
          },
          {
            "component": "text",
            "valueType": "string",
            "name": "sectionTitle",
            "value": "FAQs",
            "label": "Section Title"
          }
        ]
      }
    ],
```

##### Container Block Model
```json
 "models": [
    
     {
      "id": "cards",
      "fields": [
        {
          "component": "text",
          "valueType": "string",
          "name": "heading",
          "label": "Section Heading",
          "required": true
        },
        {
          "component": "text",
          "valueType": "string",
          "name": "subheading",
          "label": "Section Subheading"
        },
      ]
    },
    {
      "id": "card",
      "fields": [
        {
          "component": "reference",
          "valueType": "string",
          "name": "image",
          "label": "Image",
          "multi": false
        },
        {
          "component": "richtext",
          "name": "text",
          "value": "",
          "label": "Text",
          "valueType": "string"
        }
      ]
    }
  ],
  '''


## Block Structure Types

### 1. Simple Blocks
- Properties render as single rows/columns in order defined in model
- Example:
  ```json
  {
    "name": "Hero",
    "model": "hero",
    "image": "/content/dam/image.png",
    "imageAlt": "Helix - a shape like a corkscrew",
    "text": "<h1>Welcome to AEM</h1>"
  }
  ```

### 2. Key-Value Blocks
- Configuration-focused blocks (like section metadata)
- Renders as key-value pair table
- Example:
  ```json
  {
    "name": "Featured Articles",
    "model": "spreadsheet-input",
    "key-value": true,
    "source": "/content/site/articles.json",
    "keywords": ["Developer","Courses"],
    "limit": 4
  }
  ```

### 3. Container Blocks
- Two-dimensional structure with properties and children
- Children are typically of the same type or model
- Example:
  ```json
  {
    "name": "Our Partners",
    "model": "text-only",
    "filter": "our-partners",
    "text": "<p>Our community of partners is...</p>",
    "item_0": {
      "model": "linked-icon",
      "image": "/content/dam/partners/foo.png",
      "imageAlt": "Icon of Foo",
      "link": "https://foo.com/"
    },
    "item_1": {
      "model": "linked-icon",
      "image": "/content/dam/partners/bar.png",
      "imageAlt": "Icon of Bar",
      "link": "https://bar.com"
    }
  }
  ```

## Semantic Content Modeling Techniques

### 1. Type Inference
AEM can infer semantic meaning from values:
- **Images**: References to image assets render as `<picture><img></picture>`
- **Links**: URL references render as `<a href="">`
- **Rich Text**: Content starting with HTML elements renders as rich text
- **Class Names**: `classes` property treated as block options
- **Value Lists**: Multi-value properties concatenated as comma-separated lists

### 2. Field Collapse
Combines multiple field values into single semantic elements using naming conventions:
- Suffixes: `Title`, `Type`, `MimeType`, `Alt`, `Text` (case sensitive)

#### Examples:
- **Images**: `image` + `imageAlt` = `<img src="" alt="">`
- **Links**: `link` + `linkTitle` + `linkText` + `linkType` = styled link
- **Headings**: `heading` + `headingType` = `<h2>`, `<h3>`, etc.

### 3. Element Grouping
Concatenates multiple semantic elements into a single cell using underscore naming convention:
- Group name separated from property by underscore: `groupName_propertyName`
- Useful for complex components with multiple related elements
- Example:
  ```json
  {
    "teaserText_subtitle": "Adobe Experience Cloud",
    "teaserText_title": "Meet the Experts",
    "teaserText_titleType": "h2",
    "teaserText_description": "<p>Join us...</p>",
    "teaserText_cta1": "https://link.to/more-details",
    "teaserText_cta1Text": "More Details"
  }
  ```

#### Block Options with Element Grouping
- Use `classes` group for multiple style options
- Boolean fields add their name as a class
- Example:
  ```json
  {
    "classes": "variant-a",
    "classes_background": "light",
    "classes_fullwidth": true
  }
  ```
  Renders as: `class="teaser variant-a light fullwidth"`

## Section and Section Metadata
- Similar to blocks but with resource type `core/franklin/components/section/v1/section`
- Can have name, filter ID, and model ID
- Model defines section metadata as key-value block
- Example model for section metadata:
  ```json
  {
    "id": "section",
    "fields": [
      {
        "component": "multiselect",
        "name": "style",
        "label": "Style",
        "valueType": "string",
        "options": [
          {"name": "Fade in Background", "value": "fade-in"},
          {"name": "Highlight", "value": "highlight"}
        ]
      },
      {
        "component": "reference",
        "valueType": "string",
        "name": "background",
        "label": "Image",
        "multi": false
      }
    ]
  }
  ```

## Important Notes
1. Always use `core/franklin/components/block/v1/block` resource type for blocks
2. Always define block name (used to fetch styles and scripts)
3. Model ID is optional but defines fields in properties panel
4. Filter ID is optional but can limit which children can be added
5. **Always add new block names to container filters** where they should be available (e.g., add to the "components" array in `_section.json` to make it available in sections)
6. Custom AEM components are not recommended - use provided components
7. The markup structure is a contract between AEM and other system parts - don't customize it
