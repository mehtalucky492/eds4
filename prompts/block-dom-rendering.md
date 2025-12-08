# AEM Block DOM Rendering Guide

This document describes how AEM block components are rendered in the DOM, which is crucial for developing CSS and JavaScript that interacts with block content.

## HTML Structure for AEM Block Components

### 1. Section Container Structure
- The section div is not part of the block itself but contains it
- It gets assigned two classes:
  - `section` (standard)
  - `[block-name]-container` (block-specific)
- It also receives a `data-section-status="loaded"` attribute

```html
<div class="section tester-card-container" data-section-status="loaded">
  <!-- Block content goes here -->
</div>
```

### 2. Block Wrapper Structure
- Blocks are wrapped in a div with class `[block-name]-wrapper`
- The block itself has classes `[block-name]` and `block`
- The block also has data attributes:
  - `data-block-name="[block-name]"`
  - `data-block-status="loaded"`

```html
<div class="tester-card-wrapper">
  <div class="tester-card block" data-block-name="tester-card" data-block-status="loaded">
    <!-- Fields go here -->
  </div>
</div>
```

### 3. Field Rendering Pattern
- All visible fields follow the same generic div structure regardless of field type
- Fields use a double-nested div structure without specific class names
- Content appears within the inner div, appropriate to the field type:
  - Text/richtext fields: `<div><div><p>Content</p></div></div>`
  - Image fields: `<div><div><picture>...</picture></div></div>`
- **Fields used as attributes** (e.g., alt text for images):
  - These fields do NOT render as separate divs in the DOM
  - They are applied directly as attributes to their target elements
  - Example: Image alt text is applied to the `<img>` tag's alt attribute
- **IMPORTANT:** 
  - No custom classes should be added to the inner content elements (p, picture, etc.)
    - CORRECT: `<div><div><p>Content</p></div></div>`
    - INCORRECT: `<div><div><p class="custom-class">Content</p></div></div>`
  - Do not wrap field content in semantic HTML elements (blockquote, article, section, etc.)
    - CORRECT: `<div><div><p>Quote content</p></div></div>`
    - INCORRECT: `<div><div><blockquote><p>Quote content</p></blockquote></div></div>`

```html
<!-- Example of text field -->
<div>
  <div><p>Field content</p></div>
</div>

<!-- Example of image field -->
<div>
  <div>
    <picture>
      <source type="image/webp" srcset="path-to-image.png?width=2000&format=webply&optimize=medium" media="(min-width: 600px)">
      <source type="image/webp" srcset="path-to-image.png?width=750&format=webply&optimize=medium">
      <source type="image/png" srcset="path-to-image.png?width=2000&format=png&optimize=medium" media="(min-width: 600px)">
      <img loading="lazy" alt="Alt text" src="path-to-image.png?width=750&format=png&optimize=medium" width="750" height="500">
    </picture>
  </div>
</div>

<!-- IMPORTANT: Attribute fields example -->
<!-- In this example, we have two fields in the content model:
     1. "image" field (reference type)
     2. "imageAlt" field (text type used as an attribute)
     
     In the DOM, only the image field creates a div structure.
     The imageAlt field value is applied directly to the img alt attribute.
     
     CORRECT representation:
-->
<div>
  <div>
    <picture>
      <!-- Image field renders the picture element -->
      <!-- imageAlt field value is used here as an attribute -->
      <img alt="This is from the imageAlt field" src="...">
    </picture>
  </div>
</div>

<!-- INCORRECT representation (do not do this): -->
<!-- Do not create a separate div for the imageAlt field -->
<div>
  <div>
    <picture><img alt="..." src="..."></picture>
  </div>
</div>
<div>
  <div>
    <!-- This should not exist! -->
  </div>
</div>
```

### 4. Container Fields
- Container fields in the content model are for authoring organization only
- They do not create additional wrapper divs in the rendered HTML
  - CORRECT: Fields in containers are rendered as individual field divs at the same level as other fields
  - INCORRECT: Adding wrapper divs like `<div class="container-name">` around the container fields
- Fields within a container are rendered the same as fields outside containers, with no indication they belong to a container
- Each field gets its own separate div structure as described above, maintaining the same depth in the DOM

> **IMPORTANT: JSON Model vs. DOM Structure Difference**
> 
> While in the JSON content model, fields within a container are nested inside a `fields` array of the container object:
> ```json
> {
>   "component": "container",
>   "name": "authorContainer",
>   "fields": [
>     { "component": "text", "name": "authorName" },
>     { "component": "text", "name": "authorPosition" }
>   ]
> }
> ```
> 
> In the DOM, these fields are rendered flat, at the same level as other fields:
> ```html
> <div class="block">
>   <!-- Field outside container -->
>   <div><div><p>Field outside container</p></div></div>
>   
>   <!-- Fields from container (no wrapper) -->
>   <div><div><p>Author Name</p></div></div>
>   <div><div><p>Author Position</p></div></div>
> </div>
> ```

- Example:
  ```html
  <!-- CORRECT: Fields from a container rendered directly in the block -->
  <div class="block">
    <!-- Field outside container -->
    <div><div><p>Field outside container</p></div></div>
    
    <!-- These fields are from a container but have no extra wrapper -->
    <div><div><p>Container field 1</p></div></div>
    <div><div><p>Container field 2</p></div></div>
  </div>
  
  <!-- INCORRECT: Extra wrapper div for container fields -->
  <div class="block">
    <div><div><p>Field outside container</p></div></div>
    <div class="container-name">  <!-- THIS WRAPPER SHOULD NOT EXIST -->
      <div><div><p>Container field 1</p></div></div>
      <div><div><p>Container field 2</p></div></div>
    </div>
  </div>
  ```
### 5. Field Order
- Fields are rendered in the order they appear in the content model
- This includes fields from containers, which are rendered in sequence with other fields
- There is no visual indication in the DOM of which fields belong to a container

## Implications for CSS Development

When developing CSS for blocks:

1. Target fields by their position in the DOM rather than by specific classes
2. Use nth-child selectors to target specific fields when needed
3. Remember that the field order in the DOM will match the order in the content model
   - **Important:** Fields used as attributes (e.g., imageAlt) do not create DOM elements
   - Skip attribute fields when counting for nth-child selectors
4. Consider using CSS custom properties (variables) to maintain consistency

Example CSS pattern:
```css
.tester-card-wrapper > .tester-card > div:nth-child(1) {
  /* Styles for the first field (image) */
}

.tester-card-wrapper > .tester-card > div:nth-child(2) {
  /* Styles for the second field (quote) */
}

/* And so on for other fields */
```

## Implications for JavaScript Development

When developing JavaScript that interacts with block content:

1. Use querySelector with child selectors to target specific fields
2. Consider adding data attributes in your CSS/JS if you need more specific targeting
3. Remember that the DOM structure is generic and doesn't include field-specific classes
4. **Important:** When calculating field positions:
   - Skip fields used as attributes (they don't create DOM elements)
   - Account for this when using nth-child selectors

Example JavaScript pattern:
```javascript
// Consider a block with these fields:
// 1. image (reference field - creates DOM element)
// 2. imageAlt (text field used as attribute - does NOT create DOM element)
// 3. quote (richtext field - creates DOM element)
// 4. authorName (text field - creates DOM element)

// Get the image element
const image = document.querySelector('.feature-card > div:nth-child(1) img');

// Get the alt text (from an attribute, not a separate DOM element)
const altText = image.getAttribute('alt');

// Get the quote text (this is the 2nd div in the DOM, not the 3rd)
// because imageAlt doesn't create a DOM element
const quoteText = document.querySelector('.feature-card > div:nth-child(2) > div > p').textContent;

// Get the author name (this is the 3rd div in the DOM, not the 4th)
const authorName = document.querySelector('.feature-card > div:nth-child(3) > div > p').textContent;
```

This document should be used in conjunction with the `aem-content-modeling-reference.md` to understand how content models relate to the rendered DOM structure.
