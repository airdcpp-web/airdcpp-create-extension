const fs = require('fs');



module.exports = function (socket, extensionInfo, settingDefinitions) {
	let settings;

	const CONFIG_FILE = extensionInfo.configPath + 'config.json';

	// Handler for API event for updated settings
	const onSettingsUpdated = (updatedValues) => {
		settings = {
			...settings,
			...updatedValues
		};

		socket.logger.verbose(`Writing settings to ${CONFIG_FILE}...`);

		fs.writeFile(CONFIG_FILE, JSON.stringify(settings), err => {
			if (err) {
				socket.logger.error(`Failed to save settings to ${CONFIG_FILE}: ${err}`);
			}
		});
	};

	// Get setting value by key
	const getValue = key => {
		return settings[key];
	};

	// Initialize settings API
	const registerApi = async (settingsLoaded) => {
		// Send definitions
		await socket.post(`extensions/${extensionInfo.name}/settings/definitions`, settingDefinitions);

		if (settingsLoaded) {
			// Send the loaded settings

			// Remove possible obsolete settings that were loaded (those would cause an error with the API)
			const filteredSettings = Object.keys(settings).reduce((reduced, key) => {
				if (settingDefinitions.find(def => def.key === key)) {
					reduced[key] = settings[key];
				}

				return reduced;
			}, {});

			await socket.patch(`extensions/${extensionInfo.name}/settings`, filteredSettings);
		}

		// Listen for updated setting values
		socket.addListener('extensions', 'extension_settings_updated', onSettingsUpdated, EXTENSION_NAME);
	}

	const initialize = () => {
		let settingsLoaded = false;

		// Attempt to load saved settings
		try {
			socket.logger.verbose(`Loading settings from ${CONFIG_FILE}...`);

			settings = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
			settingsLoaded = true;
		} catch (err) {
			socket.logger.verbose(`Failed to load settings: ${err}`);

			// Build defaults from definitions
			settings = settingDefinitions.reduce((reduced, def) => {
				reduced[def.key] = def.defaultValue;
				return reduced;
			}, {});
		}

		registerApi(settingsLoaded)
			.catch(err => console.error('Failed to register settings: ' + err.message));
	};


	initialize();

	return {
		getValue
	};
};