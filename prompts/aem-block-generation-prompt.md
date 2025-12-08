# Prompt for Generating an AEM Block Component
Refer to prompts/aem-content-modeling-reference and aem-universal-header-field-types.md to create the "Output" defined below based on the "Details" below:

**Output**
1. Create the block subdirectory under blocks using the name [block-name]. The block subdirectory is where all files should be created.
2. Create a content model with the file name _[block_name].json. Do not create js or css files at this time.
3. Create an original.html containing the expected rendered output for the block. Refer to prompts/block-dom-rendering.md for details.

# Details

## Block Information
- Block name: [block-name in kebab-case]
- Display title: [Title with Proper Case]
- Description: [Brief description of the block's purpose]

## Block Type
Select one of the following:
- [ ] Simple Block: Properties render as single rows/columns
- [ ] Key-Value Block: Configuration-focused with key-value pairs
- [ ] Container Block: Two-dimensional structure with children

## Block Fields
For each field, specify:
1. Name: [camelCase field name]
2. Label: [Human-readable label]
3. Component type: [Choose from component types in `aem-universal-editor-field-types.md`]
4. Value Type: [string | number | boolean]
5. Required: [true | false]
6. Default Value (if any): [default value]
7. Description (optional): [Helper text for authors]
8. Multi-value (if applicable): [true | false]
9. Options (for select/multiselect): [Array of {value, label} or {value, name} pairs]
10. Additional properties (if needed):
    - `reference` / `aem-content`: 
      - `rootPath`: [Path to limit content browsing, e.g., "/content/dam/site-name"]
    - `date-time`:
      - `displayFormat`: [Format for displaying the date]
      - `valueFormat`: [Format for storing the date]
    - `number`:
      - `numberMin`: [Minimum value allowed]
      - `numberMax`: [Maximum value allowed]
    - `text` / `textarea`:
      - `minLength`: [Minimum character length]
      - `maxLength`: [Maximum character length]
      - `regExp`: [Validation regex pattern]
    - `container`:
      - `collapsible`: [true | false]
      - `fields`: [Array of field definitions that belong to this container - REQUIRED]
    - `aem-content-fragment` / `aem-experience-fragment`:
      - `variationName`: [Variable to store selected variation]
      - `rootPath`: [Path to limit content browsing]
    - Any component:
      - `placeholder`: [Placeholder text]
      - `readOnly`: [true | false]
      - `hidden`: [true | false]
      - `customErrorMsg`: [Custom validation error message]
11. Container fields: If this field is a container type, define nested fields using the following format:
    ```
    Container fields: [
      {
        Name: [camelCase field name]
        Label: [Human-readable label]
        Component type: [component type]
        Value Type: [string | number | boolean]
        Required: [true | false]
        Default Value: [default value]
        Description: [Helper text for authors]
        Multi-value: [true | false]
        Options: [options if applicable]
        Additional properties: [any additional properties]
      },
      {
        Name: [second field name]
        Label: [second field label]
        ...
      }
    ]
    ```
    NOTE: All fields for a container MUST be nested within the container's "fields" array in the JSON model, not as separate fields at the same level as the container.

## Child Item Definition (For Container Blocks)
If you selected Container Block above, define the child item:

1. Child Item Name: [child-item-name in kebab-case]
2. Child Display Title: [Child Title with Proper Case]
3. Child Item Fields:
   - Define each field using the same format as Block Fields above
   - Specify any field relationships as needed

## Output Structure
Please follow the structure examples in `aem-content-modeling-reference.md` and the block JSON examples in `aem-field-types-reference.md` for:

1. Simple blocks (single dimension with properties as rows)
2. Key-value blocks (configuration properties displayed as key-value pairs)
3. Container blocks (two-dimensional with properties and children)

Ensure the JSON structure includes:
- Complete `definitions` section with:
  - Proper resource types (`core/franklin/components/block/v1/block` for main blocks)
  - Child item definitions using `core/franklin/components/block/v1/block/item` for container blocks
  - Appropriate template configuration with name, model, and filter references
- `models` section with:
  - All specified fields and properties structured as outlined in the Field Types Reference
  - Proper valueTypes and component types for each field
  - For container fields, ensure all nested fields are within the container's "fields" array like this:
    ```json
    {
      "component": "container",
      "name": "authorContainer",
      "label": "Author Container",
      "collapsible": true,
      "fields": [
        {
          "component": "text",
          "name": "authorName",
          "label": "Author Name",
          "valueType": "string"
        },
        {
          "component": "text",
          "name": "authorPosition",
          "label": "Author Position",
          "valueType": "string"
        }
      ]
    }
    ```
- `filters` section:
  - Empty array for simple blocks
  - Component limitations for container blocks (listing allowed child components)

## Container Model
This block should be available in the [section | specific-container] container

