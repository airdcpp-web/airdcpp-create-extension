const webpack = require('webpack');
const nodemon = require('nodemon');

const path = require('path');

const webpackConfig = require('../webpack.config.js');


let started = false;

webpack(webpackConfig).watch(100, function(err, stats) {
	if (err) {
		console.error(err);
		return;
	}

	if (!started) {
		started = true;

		const command = path.resolve(__dirname, 'dev-server.js');
		nodemon({
			execMap: {
				js: 'node'
			},
			args: process.argv.length > 2 ? process.argv.slice(2) : [ path.resolve(__dirname, '../dist/main.js') ],
			script: command,

			// Don't watch anything
			ignore: ['*'],
			watch: ['foo/'],
			ext: 'noop'
		}).on('restart', function() {
			// Restart finished
		});
	} else {
		console.log('Changes detected, restarting...');
		nodemon.restart();
	}
});
