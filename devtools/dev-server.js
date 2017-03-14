const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const ApiSocket = require('airdcpp-apisocket').Socket;
const socket = ApiSocket(require('./settings.js'));



const logStatus = (msg) => {
	console.log(chalk.cyan.bold('[DEV] ' + msg));
};

const logError = (msg) => {
	console.log(chalk.red.bold('[DEV] ' + msg));
};

const onExtensionRegistered = (extensionInfo) => {
	// Use timeout so that we won't throw if the code doesn't work
	setTimeout(_ => {
		const scriptPath = process.argv[2] || '../dist/main.js';
		logStatus('Extension registered, starting the script ' + scriptPath + '...');

		// Run the script
		const ScriptEntry = require(scriptPath);
		ScriptEntry(socket, extensionInfo);
	}, 10);
};

const getExtensionInfo = (sessionInfo, packageFile) => {
	// Init logs
	const logPath = path.resolve(__dirname, 'logs' + sessionInfo.system_info.path_separator);
	const configPath = path.resolve(__dirname, 'settings' + sessionInfo.system_info.path_separator);

	if (!fs.existsSync(logPath)){
		fs.mkdirSync(logPath);
	}

	if (!fs.existsSync(configPath)){
		fs.mkdirSync(configPath);
	}

	return {
		name: packageFile.name,
		configPath,
		logPath,
		sessionInfo
	};
};

const parsePackage = () => {
	const packageFile = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));

	// Remove a some of the the properties to make the console log a bit cleaner (and to prevent the debug build from crashing)
	return Object.keys(packageFile).reduce((reduced, key) => {
		if (key !== 'devDependencies' && key !== 'dependencies' && key !== 'scripts') {
			reduced[key] = packageFile[key];
		}

		return reduced;
	}, {});
};

// Socket state handlers
socket.onConnected = (sessionInfo) => {
	logStatus('Socket connected, registering extension...');

	const packageInfo = parsePackage();
	socket.post('extensions', packageInfo)
		.then(_ => {
			onExtensionRegistered(getExtensionInfo(sessionInfo, packageInfo));
		}, e => {
			logError('Failed to register the extension, shutting down...');
			process.exit(1);
		});
};

socket.onDisconnected = () => {
	logStatus('Socket disconnected, exiting');
	process.exit(1);
};

logStatus('Connecting socket...');
socket.connect();