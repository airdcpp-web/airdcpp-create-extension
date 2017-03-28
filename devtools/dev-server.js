const fs = require('fs');
const path = require('path');

const RemoteExtension = require('./RemoteExtension');

const extensionConfig = {
	packageInfo: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')),
	dataPath: __dirname,
	nameSuffix: '-dev',
};

RemoteExtension(
	require(process.argv[2] || '../dist/main.js'), 
	require('./settings.js'), 
	extensionConfig
);