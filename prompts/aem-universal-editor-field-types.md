# AEM Universal Editor Field Types Reference

This document provides a comprehensive reference for field types available in the AEM Universal Editor. Use this information when generating new blocks with the `aem-block-generation-prompt.md` template to ensure your field definitions are correctly formatted and use the most appropriate component types for your requirements.

## Model Definition Structure

A model definition is a JSON structure that starts with an array of models:

```json
[
  {
    "id": "model-id",        // must be unique
    "fields": []             // array of fields to render in the properties panel
  }
]
```

## Field Configuration Properties

> **⚠️ IMPORTANT NOTE ABOUT OPTIONS:**
> For all components that use an options array (select, multiselect, radio-group, etc.), 
> always use the **`name`** property for display text, NOT **`label`**. This is a common mistake.
> 
> **CORRECT:** `{ "name": "Option Label", "value": "option-value" }`
> 
> **INCORRECT:** `{ "label": "Option Label", "value": "option-value" }`

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `component` | String | UI component type (see Component Types below) | Yes |
| `name` | String | Property or path where data will be persisted | Yes |
| `label` | String | Display label in editor | Yes |
| `description` | String | Description/helper text for the field | No |
| `placeholder` | String | Placeholder text for input fields | No |
| `value` | Any | Default value | No |
| `valueType` | String | Data type (`string`, `string[]`, `number`, `date`, `boolean`) | No |
| `required` | Boolean | Whether field is mandatory | No |
| `readOnly` | Boolean | Whether field is read-only | No |
| `hidden` | Boolean | Whether field is hidden by default | No |
| `condition` | Object | Rule to show/hide field based on a condition | No |
| `multi` | Boolean | Whether field accepts multiple values | No |
| `validation` | Object | Validation rule(s) for the field | No |
| `raw` | Any | Raw data for component use | No |

## Component Types

### AEM Tag (`aem-tag`)

AEM tag picker for attaching tags to a component.

```json
{
  "component": "aem-tag",
  "label": "AEM Tag Picker",
  "name": "cq:tags",
  "valueType": "string"
}
```

### AEM Content (`aem-content`)

AEM content picker for selecting any AEM resource (not just assets).

**Additional Validation:**

| Validation | Type | Description | Required |
|------------|------|-------------|----------|
| `rootPath` | String | Path to limit content selection to | No |

```json
{
  "component": "aem-content",
  "name": "reference",
  "value": "",
  "label": "AEM Content Picker",
  "valueType": "string",
  "validation": {
    "rootPath": "/content/refresh"
  }
}
```

### Boolean (`boolean`)

Toggle switch for true/false values.

**Additional Validation:**

| Validation | Type | Description | Required |
|------------|------|-------------|----------|
| `customErrorMsg` | String | Custom error message | No |

```json
{
  "component": "boolean",
  "label": "Boolean",
  "name": "boolean",
  "valueType": "boolean"
}
```

### Checkbox Group (`checkbox-group`)

Multiple checkbox selection.

```json
{
  "component": "checkbox-group",
  "label": "Checkbox Group",
  "name": "checkbox",
  "valueType": "string[]",
  "options": [
    { "name": "Option 1", "value": "option1" },
    { "name": "Option 2", "value": "option2" }
  ]
}
```

### Container (`container`)

Groups components with optional multifield support. The `fields` array is REQUIRED for container components and all fields that should be part of the container must be defined within this array, not as separate fields at the same level as the container.

**Additional Configuration:**

| Configuration | Type | Description | Required |
|---------------|------|-------------|----------|
| `collapsible` | Boolean | Whether container is collapsible | No |
| `fields` | Array | Array of field definitions that belong to this container | Yes |

```json
{
  "component": "container",
  "label": "Container",
  "name": "container",
  "valueType": "string",
  "collapsible": true,
  "fields": [
    {
      "component": "text",
      "label": "Simple Text 1",
      "name": "text",
      "valueType": "string"
    },
    {
      "component": "text",
      "label": "Simple Text 2",
      "name": "text2",
      "valueType": "string"
    }
  ]
}
```

**Author Information Container Example:**

```json
{
  "component": "container",
  "name": "authorContainer",
  "label": "Author Container",
  "collapsible": true,
  "description": "Container for author information",
  "fields": [
    {
      "component": "text",
      "valueType": "string",
      "name": "authorName",
      "label": "Author Name",
      "required": true,
      "description": "Name of the person providing the testimonial"
    },
    {
      "component": "text",
      "valueType": "string",
      "name": "authorPosition",
      "label": "Author Position",
      "required": false,
      "description": "Job title or role of the author"
    },
    {
      "component": "text",
      "valueType": "string",
      "name": "authorCompany",
      "label": "Author Company",
      "required": false,
      "description": "Company or organization of the author"
    }
  ]
}
```

**Multifield Container Example:**

```json
{
  "component": "container",
  "name": "test",
  "label": "Multi Text",
  "multi": true,
  "fields": [
    {
      "component": "reference",
      "name": "image",
      "value": "",
      "label": "Sample Image",
      "valueType": "string"
    },
    {
      "component": "text",
      "name": "alt",
      "value": "",
      "label": "Alt Text",
      "valueType": "string"
    }
  ]
}
```

### Content Fragment (`aem-content-fragment`)

Picker for Content Fragments.

**Additional Configuration:**

| Configuration | Type | Description | Required |
|---------------|------|-------------|----------|
| `variationName` | String | Variable name to store selected variation | No |

**Additional Validation:**

| Validation | Type | Description | Required |
|------------|------|-------------|----------|
| `rootPath` | String | Path to limit content selection to | No |

```json
{
  "component": "aem-content-fragment",
  "name": "picker",
  "label": "Content Fragment Picker",
  "valueType": "string",
  "variationName": "contentFragmentVariation",
  "validation": {
    "rootPath": "/content/refresh"
  }
}
```

### Date Time (`date-time`)

Date and/or time picker.

**Additional Configuration:**

| Configuration | Type | Description | Required |
|---------------|------|-------------|----------|
| `displayFormat` | String | Format for displaying the date | Yes |
| `valueFormat` | String | Format for storing the date | Yes |

**Additional Validation:**

| Validation | Type | Description | Required |
|------------|------|-------------|----------|
| `customErrorMsg` | String | Custom error message | No |

```json
{
  "component": "date-time",
  "valueType": "date-time",
  "name": "field1",
  "label": "Date Time",
  "description": "This is a date time field that stores both date and time.",
  "required": true,
  "placeholder": "YYYY-MM-DD HH:mm:ss",
  "displayFormat": null,
  "valueFormat": null,
  "validation": {
    "customErrorMsg": "Please enter a valid date and time."
  }
}
```

### Experience Fragment (`aem-experience-fragment`)

Picker for Experience Fragments.

**Additional Configuration:**

| Configuration | Type | Description | Required |
|---------------|------|-------------|----------|
| `variationName` | String | Variable name to store selected variation | No |

**Additional Validation:**

| Validation | Type | Description | Required |
|------------|------|-------------|----------|
| `rootPath` | String | Path to limit content selection to | No |

```json
{
  "component": "aem-experience-fragment",
  "valueType": "string",
  "name": "experience-fragment",
  "label": "experience-fragment",
  "variationName": "experienceFragmentVariation",
  "validation": {
    "rootPath": "/content/refresh"
  }
}
```

### Multiselect (`multiselect`)

Dropdown with multiple selection capabilities.

**Important Note:** Multiselect options MUST use "name" for display text (not "label").

```json
{
  "component": "multiselect",
  "name": "multiselect",
  "label": "Multi Select",
  "valueType": "string",
  "options": [
    { "name": "Option 1", "value": "option1" },
    { "name": "Option 2", "value": "option2" }
  ]
}
```

**Grouped Options Example:**

```json
{
  "component": "multiselect",
  "name": "property",
  "label": "Multiselect field",
  "valueType": "string",
  "required": true,
  "maxSize": 2,
  "options": [ // Remember to use "name" (not "label") for all options and optgroups
    {
      "name": "Theme",
      "children": [
        { "name": "Light", "value": "light" },
        { "name": "Dark", "value": "dark" }
      ]
    },
    {
      "name": "Type",
      "children": [
        { "name": "Alpha", "value": "alpha" },
        { "name": "Beta", "value": "beta" },
        { "name": "Gamma", "value": "gamma" }
      ]
    }
  ]
}
```

### Number (`number`)

Numeric input field.

**Additional Validation:**

| Validation | Type | Description | Required |
|------------|------|-------------|----------|
| `numberMin` | Number | Minimum value allowed | No |
| `numberMax` | Number | Maximum value allowed | No |
| `customErrorMsg` | String | Custom error message | No |

```json
{
  "component": "number",
  "valueType": "number",
  "name": "field1",
  "label": "Number Field",
  "description": "This is a number field.",
  "required": true,
  "validation": {
    "numberMin": 0,
    "numberMax": 100,
    "customErrorMsg": "Please enter a number between 0 and 100."
  }
}
```

### Radio Group (`radio-group`)

Mutually exclusive option selection.

**Important Note:** Radio group options MUST use "name" for display text (not "label").

```json
{
  "component": "radio-group",
  "label": "Radio Group",
  "name": "radio",
  "valueType": "string",
  "options": [
    { "name": "Option 1", "value": "option1" },
    { "name": "Option 2", "value": "option2" }
  ]
}
```

### Reference (`reference`)

Asset picker for selecting AEM assets.

```json
{
  "component": "reference",
  "label": "Reference",
  "name": "reference",
  "valueType": "string"
}
```

### Rich Text (`richtext`)

Rich text editor with formatting controls.

```json
{
  "component": "richtext",
  "name": "rte",
  "label": "Rich Text",
  "valueType": "string"
}
```

### Select (`select`)

Dropdown with single selection.

**Important Note:** Select options MUST use "name" for display text (not "label").

```json
{
  "component": "select",
  "label": "Select",
  "name": "select",
  "valueType": "string",
  "options": [
    { "name": "Option 1", "value": "option1" },
    { "name": "Option 2", "value": "option2" }
  ]
}
```

**❌ INCORRECT FORMAT (Do not use):**
```json
"options": [
  { "label": "Option 1", "value": "option1" },  // WRONG - uses "label" instead of "name"
  { "label": "Option 2", "value": "option2" }   // WRONG - uses "label" instead of "name"
]
```

**✅ CORRECT FORMAT (Required):**
```json
"options": [
  { "name": "Option 1", "value": "option1" },   // CORRECT - uses "name" for display text
  { "name": "Option 2", "value": "option2" }    // CORRECT - uses "name" for display text
]
```

### Tab (`tab`)

Groups fields into separate tabs.

```json
{
  "id": "tab",
  "fields": [
    {
      "component": "tab",
      "label": "Tab 1",
      "name": "tab1"
    },
    {
      "component": "text-input",
      "label": "Text 1",
      "name": "text1",
      "valueType": "string"
    },
    {
      "component": "tab",
      "label": "Tab 2",
      "name": "tab2"
    },
    {
      "component": "text-input",
      "label": "Text 2",
      "name": "text2",
      "valueType": "string"
    }
  ]
}
```

### Text (`text`)

Single-line text input field.

**Additional Validation:**

| Validation | Type | Description | Required |
|------------|------|-------------|----------|
| `minLength` | Number | Minimum character length | No |
| `maxLength` | Number | Maximum character length | No |
| `regExp` | String | Regular expression pattern | No |
| `customErrorMsg` | String | Custom error message | No |

```json
{
  "component": "text",
  "name": "text",
  "label": "Simple Text",
  "valueType": "string",
  "validation": {
    "minLength": 5,
    "maxLength": 50,
    "regExp": "^[a-zA-Z0-9 ]+$",
    "customErrorMsg": "Please enter alphanumeric characters only (5-50 characters)."
  }
}
```

## Field Relationship Naming Conventions

Field naming conventions are critical for ensuring proper relationships between fields and automatic UI behavior in the Universal Editor. Following these conventions is essential for maintaining consistency and functionality.

### Field Collapse Suffixes

Related fields are automatically grouped in the UI based on these naming conventions:

- `Title`: Add title attribute to a link
- `Type`: Specify element type (h1, h2, etc.)
- `MimeType`: Define mime type for a resource
- `Alt`: Add alt text to an image
- `Text`: Provide display text for elements like links

**Common Examples:**

1. **Images with alt text:**
   - `image`: Path to image asset
   - `imageAlt`: Alternative text for accessibility
   - Result: `<img src="/path/to/image" alt="Alt text description">`

2. **Links with metadata:**
   - `link`: URL value
   - `linkTitle`: Title attribute (tooltip)
   - `linkText`: Display text
   - `linkType`: Style variation (e.g., "primary", "secondary")
   - Result: `<a href="/path" title="Title" class="btn-primary">Link Text</a>`

3. **Headings with type control:**
   - `heading`: Heading text
   - `headingType`: Heading level (h1-h6) or style variant
   - Result: `<h2 class="heading">Heading Text</h2>`

### Element Grouping

Use underscores to group related fields:
- `groupName_fieldName` (e.g., `content_title`, `content_description`)
- Styling options: `classes_optionName` (e.g., `classes_background`)

Example:
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
- Use `classes` group for style options
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

## Complete Model Examples

### Simple Block

```json
{
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
  "models": [
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
          "name": "text",
          "value": "",
          "label": "Text",
          "valueType": "string"
        }
      ]
    }
  ],
  "filters": []
}
```

### Container Block

```json
{
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
        }
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
  "filters": [
    {
      "id": "cards",
      "components": [
        "card"
      ]
    }
  ]
}
```

## Loading a Model Definition

Models can be loaded from external files:

```html
<script type="application/vnd.adobe.aue.model+json" src="<url-of-model-definition>"></script>
```

Or defined inline:

```html
<script type="application/vnd.adobe.aue.model+json">
  { ... model definition ... }
</script>
```

## Component Definition vs. Instrumentation

You can link a model to a component in two ways, with different use cases for each approach:

### 1. Component Definition (Preferred Method)

Include the `model` property in the component definition JSON. This is the recommended approach for production environments as it centralizes configuration and makes maintenance easier.

```json
// In component-definition.json
{
  "components": [
    {
      "id": "my-component",
      "model": "model-id",
      "resourceType": "my-component-resource-type",
      "title": "My Component"
      // ...other component properties
    }
  ]
}
```

**Best for:**
- Production implementations
- Consistent model assignment across all instances of a component
- Centralized component management

### 2. Instrumentation via HTML Attributes

Add the `data-aue-model` attribute directly to the component markup. This method is useful for prototyping or custom instances.

```html
<div 
  data-aue-resource="urn:datasource:/content/path" 
  data-aue-type="component" 
  data-aue-model="model-id">
  Component content
</div>
```

**Best for:**
- Prototyping and development
- Testing different models with the same component
- Custom one-off component instances

**Important:** If both methods are used for the same component, the instrumentation attributes in the HTML take precedence over the component definition.

## Best Practices for Content Modeling

When defining fields for AEM blocks, consider these best practices:

1. **Use Consistent Naming Conventions**
   - Follow the naming patterns for automatic grouping (e.g., `image`/`imageAlt`)
   - Use camelCase for property names
   - Group related fields with underscores (`group_field`)

2. **Organize Fields Logically**
   - Use tabs to separate content from styling options
   - Place frequently used fields at the top
   - Group related fields together

3. **Provide Helpful Context**
   - Add clear, concise descriptions for fields
   - Use appropriate placeholders
   - Include validation with helpful error messages

4. **Set Appropriate Defaults**
   - Provide sensible default values when possible
   - Consider the most common use case

5. **Optimize for Authoring Experience**
   - Limit field options to what's necessary
   - Use select/multiselect for constrained choices
   - Make container fields collapsible when appropriate

6. **Leverage Field Relationships**
   - Use naming conventions to create semantic connections
   - Consider how fields interact with each other
   - Organize related fields using the appropriate component types

7. **Validate Important Fields**
   - Set required fields thoughtfully
   - Add appropriate validation rules
   - Provide helpful custom error messages

8. **Document Component Purpose**
   - Include clear descriptions in your model
   - Document any special field interactions

9. **Register Components in Container Filters**
   - Always add new blocks to the appropriate container filters
   - Add the block name to the "components" array in `_section.json` to make it available in sections
   - For nested containers, update the parent container's filters as needed
   - Remember this crucial step to ensure your block appears in the authoring interface

Following these practices will create a more maintainable content model and a better authoring experience for content editors.
