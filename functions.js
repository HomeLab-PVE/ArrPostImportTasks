const { logger } = require('./logger');
const { fileExists } = require('./utils');
const fs = require('fs');
const path = require('path');
const envs = require('./environments');

const ignoreFile = async (action) => {
	try {
		if (!action) {
			action = 'create';
		}
		const ignoreFilePath = path.join(path.dirname(envs.movieFilePath), '.await-move');
		
		if (action === 'create') {	
			if (await fileExists(ignoreFilePath)) {
				logger.info(`Ignore file exists: ${ignoreFilePath}`);
			} else {
				await fs.promises.writeFile(ignoreFilePath, "");
				logger.info(`Ignore file created: ${ignoreFilePath}`);
			}
		} 
		else if (action === 'delete') {
			await fs.promises.unlink(ignoreFilePath, {
				force: true,
			});
			logger.info(`Ignore file deleted: ${ignoreFilePath}`);
		}
	} catch (err) {
		logger.error("ignoreFile: ", err);
	}
};

const isRequierdEnvs = () => {
	const missing = [];
	for (let env in envs) {
        if (envs[env] === null)
			missing.push(env);
    }
	if (missing.length === 0 && envs.eventType === 'Download') {
		return true;
	} else {
		if (missing.length !== 0) {
			logger.warn(`Missing environments: ${missing.join(', ')}.`);
		} else {
			if (envs.eventType !== 'Download') {
				logger.warn('Event type is not import.');
			}
		}
	}
	return false;
};

module.exports = {
	isRequierdEnvs,
	ignoreFile,
}
