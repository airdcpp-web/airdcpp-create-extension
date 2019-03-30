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
		await settings.load();

		// Send initial message
		if (settings.getValue('spam_on_startup')) {
			sendEventMessage();
		}

		// Set interval
		if (settings.getValue('spam_interval')) {
			sendInterval = setInterval(sendEventMessage, settings.getValue('spam_interval') * 60 * 1000);
		}
	};

	extension.onStop = () => {
		// Cleanup
		// When running the extension in unmanaged mode, it will not exit
		// if the server goes down (or the socket gets disconnected otherwise)
		clearInterval(sendInterval);
	};
};