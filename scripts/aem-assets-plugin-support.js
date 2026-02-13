// The based path of the aem-assets-plugin code.
const codeBasePath = `${window.hlx?.codeBasePath}/plugins/aem-assets-plugin`;

// The blocks that are to be used from the aem-assets-plugin.
// Note: 'video' removed to use custom blocks/video implementation with Vimeo/YouTube support
const blocks = [];

// Initialize the aem-assets-plugin.
export default async function assetsInit() {
  const {
    loadBlock,
    createOptimizedPicture,
    decorateExternalImages,
    createOptimizedPictureForDMOpenAPI,
    createOptimizedPictureForDM,
  } = await import(`${codeBasePath}/scripts/aem-assets.js`);
  window.hlx = window.hlx || {};
  window.hlx.aemassets = {
    codeBasePath,
    blocks,
    loadBlock,
    createOptimizedPicture,
    decorateExternalImages,
    createOptimizedPictureForDMOpenAPI,
    createOptimizedPictureForDM,
    smartCrops: {
      Small: { minWidth: 0, maxWidth: 767 },
      Medium: { minWidth: 768, maxWidth: 1023 },
      Large: { minWidth: 1024, maxWidth: 9999 },
    },
    externalImageUrlPrefixes: [
      // DM Open API (for AEM as a Cloud Service delivery)
      ['https://delivery-p172753-e1855059.adobeaemcloud.com/', createOptimizedPictureForDMOpenAPI],
      // Scene7 - Otsuka US Dynamic Media
      ['https://s7d1.scene7.com/is/image/OtsukaUSDynamicMedia/', createOptimizedPictureForDM],
    ],
  };
}
