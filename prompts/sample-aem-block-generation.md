# Prompt for Generating an AEM Block Component
Refer to prompts/aem-content-modeling-reference and aem-universal-header-field-types.md to create the "Output" defined below based on the "Details" below:

**Output**
1. Create the block subdirectory under blocks using the name [block-name]. The block subdirectory is where all files should be created.
2. Create a content model with the file name _[block_name].json. Do not create js or css files at this time.
3. Create an original.html containing the expected rendered output for the block. Refer to prompts/block-dom-rendering.md for details.

# Details

## Block Information
- Block name: feature-card
- Display title: Feature Card
- Description: A block to showcase feature with image, quote, name and affiliation

## Block Type
Select one of the following:
- [x] Simple Block: Properties render as single rows/columns
- [ ] Key-Value Block: Configuration-focused with key-value pairs
- [ ] Container Block: Two-dimensional structure with children

## Block Fields
For each field, specify:

1. Name: image
   Label: Profile Image
   Component type: reference
   Value Type: string
   Required: true
   Default Value: 
   Description: Profile photo of the author
   Multi-value: false
   Options: 
   Additional properties:
     - rootPath: "/content/dam/otsuka/testimonials"

2. Name: imageAlt
   Label: Image Alt Text
   Component type: text
   Value Type: string
   Required: true
   Default Value: 
   Description: Alternative text for accessibility
   Multi-value: false
   Options: 
   Additional properties:
     - maxLength: 125

3. Name: quote
   Label: Testimonial Quote
   Component type: richtext
   Value Type: string
   Required: true
   Default Value: 
   Description: The testimonial text (recommended length: 50-100 words)
   Multi-value: false
   Options: 
   Additional properties:
     - maxLength: 500
     - placeholder: "Enter the testimonial quote here..."

4. Name: authorContainer
   Label: Author Container
   Component type: container
   Required: true
   Description: Container for author information
   Collapsible: true
   Options: 
   Additional properties:
   
   Container fields: [
      {
        Name: authorName
        Label: Author Name
        Component type: text
        Value Type: string
        Required: true
        Default Value: 
        Description: Name of the person providing the testimonial
        Multi-value: false
        Options: 
        Additional properties:
      },
      {
        Name: authorPosition
        Label: Author Position
        Component type: text
        Value Type: string
        Required: false
        Default Value: 
        Description: Job title or role of the author
        Multi-value: false
        Options: 
        Additional properties:
      },
      {
        Name: authorCompany
        Label: Author Company
        Component type: text
        Value Type: string
        Required: false
      }
   ]
   Default Value: 
   Description: Company or organization of the author
   Multi-value: false
   Options: 
   Additional properties:

## Field Relationships
Important notes about fields:
1. Attribute fields (like alt text for images) do not create separate DOM elements
   - imageAlt values are applied directly to the img alt attribute
   - Do not represent these as separate divs in the DOM structure
   - When targeting fields with CSS/JS, skip attribute fields in your count

## Output Structure
Please follow the structure examples in `aem-content-modeling-reference.md` and the block JSON examples in `aem-universal-editor-field-types-reference.md` to match the selection above for block type.

## Container Model
This block should be available in the section container
