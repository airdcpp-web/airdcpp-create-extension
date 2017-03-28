'use strict';

// Entry point for extension-specific code

const SettingDefinitions = [
	{
		"key": 'spam_on_startup',
		"title": 'Show a test message on startup',
		"defaultValue": true,
		"type": 'boolean'
	}, {
		"key": 'spam_interval',
		"title": 'Test message send interval (minutes, 0 = disabled)',
		"defaultValue": 60,
		"type": 'number'
	}
];

module.exports = function (socket, extension) {
	const settings = require('./SettingsManager.js')(socket, extension, SettingDefinitions);
	let sendInterval;

	const sendEventMessage = () => {
		// Send a single event message

		socket.post('events', {
			// EXTENSION_VERSION is defined in the webpack config
			text: `This is a test message sent by extension ${extension.name} ${EXTENSION_VERSION}. Please visit https://github.com/airdcpp-web/airdcpp-create-extension to find out how to develop more useful extensions than this.`,
			severity: 'info',
		})
			.catch(error => console.error('Failed to send test message: ' + error.message));
	};

	extension.onStart = (sessionInfo) => {
		settings.load();

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