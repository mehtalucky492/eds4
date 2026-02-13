/**
 * Consent Management Settings
 * Configuration for cookie consent, external link popups, and privacy-compliant media
 */
const consentSettings = {
  external_link_popup: {
    whitelist: '',
    width: '85%',
    popups: [
      {
        id: 'default',
        name: 'Default',
        status: true,
        weight: 10,
        close: true,
        title: '<span class="attention">You are now leaving this website!</span>',
        body: '<p>You&#039;re now leaving our website and moving to an external site. While we strive to provide valuable resources, we can&#039;t ensure the accuracy or security of information on other websites.</p>\n',
        labelyes: 'Continue',
        labelno: 'Cancel',
        domains: '*',
        target: '_self',
      },
    ],
  },
  privacy_compliant_media_settings: {
    enabled: 1,
    general: {
      error_cmp_not_found: 'Consent management is currently disabled, website functionality may be affected. Please try reloading the page.',
    },
    youtube: {
      enabled: 1,
      cat_id: 'C0002',
      dependent_cat_id: 'C0004',
      modal: {
        description: 'To start your video we need your permission to use YouTube cookies. These cookies help us make other video recommendations specific to your interests.',
        consent_label: 'Allow YouTube cookies',
        morelink_label: 'Learn more about cookies',
        // eslint-disable-next-line no-script-url
        morelink_url: 'javascript:OneTrust.ToggleInfoDisplay();',
      },
      overlay_image: null,
    },
    vimeo: {
      enabled: 1,
      cat_id: 'C0008',
      dependent_cat_id: 'C0004',
      modal: {
        description: 'By clicking \'Accept\', you will enable functional cookies that are necessary for the video\'s playback on this platform. These cookies can be reviewed <a  href="javascript:OneTrust.ToggleInfoDisplay();">here</a> and adjusted at any time by clicking the shield above. Want to know more? View our <a target="_blank" href="https://www.otsuka-us.com/privacy-policy">Privacy Notice</a>.\r\n<a class="otsuka-pcm-consent-link" href="javascript:OneTrust.ToggleInfoDisplay();" role="button" aria-label="Learn more about cookies">Privacy Notice</a>',
        consent_label: 'Accept',
        morelink_label: '',
        morelink_url: '',
      },
      overlay_image: null,
    },
    buzzsprout_podcasts: {
      enabled: 1,
      cat_id: 'C0002',
      modal: {
        description: 'To start your podcast we need your permission to contact Buzzsprout. This allows us to place a podcast player widget on the page.',
        consent_label: 'Allow Buzzsprout player',
        morelink_label: '',
        morelink_url: '',
      },
      overlay_image: null,
    },
    orbita_live_chat: {
      enabled: 1,
      cat_id: 'C0002',
      widget: {
        wrapper_id: 'chatbot-wrapper',
        html: '<div class="with-default-orbita-widget">\r\n  <button class="chat-widget" aria-label="Show Chatbot">\r\n    <div>\r\n      <div class="chat-bubble"></div>\r\n      <p>Chat</p>\r\n    </div>\r\n  </button>\r\n</div>',
        css: '',
      },
      modal: {
        description: 'By clicking \'Accept\', you will enable functional cookies that are necessary for the chatbot functionality on this platform. These cookies can be reviewed <a  href="javascript:OneTrust.ToggleInfoDisplay();">here</a> and adjusted at any time by clicking the shield above. Want to know more? View our <a target="_blank" href="https://www.otsuka-us.com/privacy-policy">Privacy Notice</a>.',
        consent_label: 'Accept',
        morelink_label: '',
        morelink_url: '',
      },
    },
  },
};

export default consentSettings;
