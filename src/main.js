'use strict';

// Entry point for extension-specific code

module.exports = function (socket, extensionInfo) {
	// Send a single event message
	socket.post('events', {
		text: `This is a test message sent by extension ${extensionInfo.name}. Please visit https://github.com/airdcpp-web/airdcpp-create-extension to find out how to develop more useful extensions than this.`,
		severity: 'info',
	})
		.catch(error => console.error('Failed to send test message: ' + error.message))
};