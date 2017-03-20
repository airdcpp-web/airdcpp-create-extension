const ApiSocket = require('airdcpp-apisocket').Socket;

const defaultSocketOptions = {
	// API settings
	autoReconnect: false,
	
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


const argv = require('minimist')(process.argv.slice(2));


// This file will later be moved to airdcpp-apisocket

module.exports = function(ScriptEntry, userSocketOptions = {}) {
	const socket = ApiSocket(
		Object.assign(
			{
				logLevel: argv.debug ? 'verbose' : 'info',
			},
			defaultSocketOptions,
			userSocketOptions,
			{
				url: argv.apiUrl
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
				configPath: argv.settingsPath,
				logPath: argv.logPath,
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

	socket.reconnect(argv.authToken, false)
		.catch(error => {
			socket.logger.error('Failed to connect to server ' + argv.apiUrl + ', exiting...');
			process.exit(1);
		});
}