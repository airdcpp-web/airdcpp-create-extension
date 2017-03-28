const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const ApiSocket = require('airdcpp-apisocket');


const parseDataDirectory = (dataPath, directoryName) => {
	const directoryPath = path.resolve(dataPath, directoryName) + path.sep;

	if (!fs.existsSync(directoryPath)){
		fs.mkdirSync(directoryPath);
	}

	return directoryPath;
};

const logStatus = (msg) => {
	console.log(chalk.cyan.bold('[EXT] ' + msg));
};

const logError = (msg) => {
	console.log(chalk.red.bold('[EXT] ' + msg));
};

module.exports = function(Entry, socketOptions, { packageInfo, dataPath, nameSuffix }) {
	const getExtensionName = () => {
		return nameSuffix ? (packageInfo.name + nameSuffix) : packageInfo.name;
	};

	let onStart, onStop, running = false;

	const socket = ApiSocket(socketOptions, require('websocket').w3cwebsocket);
	const Extension = Entry(socket, {
		name: getExtensionName(),
		configPath: parseDataDirectory(dataPath, 'settings'),
		logPath: parseDataDirectory(dataPath, 'logs'),
		set onStart(handler) {
			onStart = handler;
		},
		set onStop(handler) {
			onStop = handler;
		},
	});

	const onExtensionRegistered = (sessionInfo) => {
		// Use timeout so that we won't throw if the code doesn't work
		setTimeout(_ => {
			logStatus('Extension ' + sessionInfo.user.username + ' registered, starting the entry...');

			// Run the script
			if (onStart) {
				onStart(sessionInfo);
				running = true;
			}
		}, 10);
	};

	const parseExtension = () => {
		// Remove a some of the the properties to make the console log a bit cleaner (and to prevent the debug build from crashing)
		const ret = Object.keys(packageInfo).reduce((reduced, key) => {
			if (key !== 'devDependencies' && key !== 'dependencies' && key !== 'scripts') {
				reduced[key] = packageInfo[key];
			}

			return reduced;
		}, {});

		return Object.assign(ret, {
			name: getExtensionName(),
		});
	};

	const stopExtension = () => {
		if (running && onStop) {
			onStop();
		}

		running = false;
	};

	const onSigint = () => {
		logStatus('Exit requested');
		process.exit();
	};

	// Socket state handlers
	socket.onConnected = (sessionInfo) => {
		logStatus('Socket connected, registering extension...');

		socket.post('extensions', parseExtension())
			.then(_ => {
				onExtensionRegistered(sessionInfo);
			}, e => {
				logError('Failed to register the extension', e);
			});
	};

	socket.onDisconnected = () => {
		logStatus('Socket disconnected');
		stopExtension();
	};

	// Closing
	process.on('exit', stopExtension);

	// Ctrl+C
	process.on('SIGINT', onSigint);


	logStatus('Connecting socket...');
	socket.connect();
};