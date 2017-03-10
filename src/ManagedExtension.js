const ApiSocket = require('airdcpp-apisocket').Socket;

const defaultSocketOptions = {
	// API settings
	autoReconnect: false,
	logLevel: 'verbose',
	ignoredRequestPaths: [
		'sessions/activity'
	]
};

// Logging
//const fs = require('fs');
/*const messageLog = fs.createWriteStream(process.argv[4] + 'output.log', { flags: 'a' });
const errorLog = fs.createWriteStream(process.argv[4] + 'error.log', { flags: 'a' });

process.stdout.write = messageLog.write.bind(messageLog);
process.stderr.write = errorLog.write.bind(errorLog);*/


const Arguments = {
	CONNECT_URL: 2,
	AUTH_TOKEN: 3,
	EXTENSION_PATH: 4
};


// This file will later be moved to airdcpp-apisocket

module.exports = function(ScriptEntry, socketOptions = {}) {
	const socket = ApiSocket(
		Object.assign(
			{},
			defaultSocketOptions,
			socketOptions,
			{
				url: process.argv[Arguments.CONNECT_URL]
			}
		)
	);
	
	let exiting = false;


	// Ping handler
	// If the application didn't perform a clean exit, the connection may stay alive indefinitely
	// (happens at least on Windows, TODO: see if it can be solved)
	// This will avoid leaving zombie extensions running that would also block the log file handles

	let lastPing = new Date().getTime() + 9999;

	const handlePing = () => {
		if (lastPing + 10000 < new Date().getTime()) {
			socket.logger.error('Socket timed out, exiting...');
			process.exit(1);
			return;
		}

		socket.post('sessions/activity')
			.then(_ => lastPing = new Date().getTime())
			.catch(_ => socket.logger.error('Ping failed'));
	};


	// Socket state handlers
	socket.onConnected = (sessionInfo) => {
		// Use timeout so that we won't throw if the code doesn't work
		setTimeout(_ => {
			setInterval(handlePing, 4000);

			const { user, system_info } = sessionInfo;
			ScriptEntry(socket, {
				name: user.username,
				configPath: process.argv[Arguments.EXTENSION_PATH] + 'settings' + system_info.path_separator,
				logPath: process.argv[Arguments.EXTENSION_PATH] + 'logs' + system_info.path_separator,
				sessionInfo
			});
		}, 10);
	};

	socket.onDisconnected = () => {
		exiting = true;
		socket.logger.info('Socket disconnected, exiting');
		process.exit(1);
	};

	/*process.on('exit', function () {
		console.log('onExit');
		if (exiting) {
			return;
		}

		exiting = true;
		console.log('Exit requested');
	});

	process.on('SIGINT', function () {
		console.log('SIGINT');
		if (exiting) {
			return;
		}

		exiting = true;
		console.log('Exit requested');
	});*/

	socket.reconnect(process.argv[Arguments.AUTH_TOKEN], false)
		.catch(error => {
			socket.logger.error('Failed to connect to the server ' + process.argv[Arguments.CONNECT_URL], ', exiting...');
			process.exit(1);
		});
}