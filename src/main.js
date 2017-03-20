'use strict';

// Entry point for extension-specific code

const SettingDefinitions = [
	{
		"key": 'spam_on_startup',
		"title": 'Show a test message on startup',
		"defaultValue": true,
		"type": 'boolean'
	}
];

module.exports = function (socket, extensionInfo) {
	const settings = require('./SettingsManager.js')(socket, extensionInfo, SettingDefinitions);

	const sendEventMessage = () => {
		// Send a single event message
		// EXTENSION_NAME and EXTENSION_VERSION are defined in the webpack config

		socket.post('events', {
			text: `This is a test message sent by extension ${EXTENSION_NAME} ${EXTENSION_VERSION}. Please visit https://github.com/airdcpp-web/airdcpp-create-extension to find out how to develop more useful extensions than this.`,
			severity: 'info',
		})
			.catch(error => console.error('Failed to send test message: ' + error.message));
	};

	if (settings.getValue('spam_on_startup')) {
		sendEventMessage();
	}
};