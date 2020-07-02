'use strict';

// Entry point for extension-specific code

const SettingDefinitions = [
  {
    key: 'spam_on_startup',
    title: 'Show a test message on startup',
    default_value: true,
    type: 'boolean'
  }, {
    key: 'spam_interval',
    title: 'Test message send interval (minutes, 0 = disabled)',
    default_value: 60,
    type: 'number'
  }
];

const CONFIG_VERSION = 1;

// Helper method for adding context menu items, docs: https://github.com/airdcpp-web/airdcpp-apisocket-js/blob/master/GUIDE.md#addContextMenuItems
const { addContextMenuItems } = require('airdcpp-apisocket');

// Settings manager docs: https://github.com/airdcpp-web/airdcpp-extension-settings-js
const SettingsManager = require('airdcpp-extension-settings');

// Entry point docs: https://github.com/airdcpp-web/airdcpp-extension-js#extension-entry-structure
// Socket reference: https://github.com/airdcpp-web/airdcpp-apisocket-js/blob/master/GUIDE.md
module.exports = function (socket, extension) {
  const settings = SettingsManager(socket, {
    extensionName: extension.name, 
    configFile: extension.configPath + 'config.json',
    configVersion: CONFIG_VERSION,
    definitions: SettingDefinitions,
  });

  let sendInterval;

  const sendEventMessage = async () => {
    // Send a single event message
    try {
      await socket.post('events', {
        // EXTENSION_VERSION is defined in the webpack config
        text: `This is a test message sent by extension ${extension.name} ${EXTENSION_VERSION}. Please visit https://github.com/airdcpp-web/airdcpp-create-extension to find out how to develop more useful extensions than this.`,
        severity: 'info',
      });
    } catch (e) {
      console.error(`Failed to send test message: ${e.message}`);
    }
  };

  extension.onStart = async (sessionInfo) => {
    // Load saved settings
    await settings.load();

    // Send initial message
    if (settings.getValue('spam_on_startup')) {
      sendEventMessage();
    }

    // Set interval for sending our test message
    if (settings.getValue('spam_interval')) {
      sendInterval = setInterval(sendEventMessage, settings.getValue('spam_interval') * 60 * 1000);
    }

    // Add a test context menu item for the extension
    const subscriberInfo = {
      id: 'airdcpp-create-extension',
      name: 'Extension starter kit'
    };

    if (sessionInfo.system_info.api_feature_level >= 4) {
      addContextMenuItems(
        socket,
        [
          {
            id: 'send_test_message',
            title: `Send test message in event log`,
            icon: {
              semantic: 'pink bell' // See https://fomantic-ui.com/elements/icon.html for available Web UI icons
            },
            onClick: () => {
              sendEventMessage();
            },
            filter: selectedIds => selectedIds.indexOf(extension.name) !== -1 // Add the menu item only for our own extension
          }
        ],
        'extension',
        subscriberInfo,
      );
    }
  };

  extension.onStop = () => {
    // Cleanup
    // When running the extension in unmanaged mode, it will not exit
    // if the server goes down (or the socket gets disconnected otherwise)
    clearInterval(sendInterval);
  };
};