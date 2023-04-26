const request = require('requestretry');
const envs = require('./../environments');
const { logger } = require('./../logger');
const { capitalize } = require('./../utils');

const bazarrRequest = async (path, opts = {}) => {
	try {
		if (!envs.bazarrAddress || !envs.bazarrApiKey) {
			logger.warn(`Bazarr IP:PORT/API Key not found in .env. Skiping...`)
			return false;
		}		
		opts['headers'] = {
			'x-api-key': `${envs.bazarrApiKey}`,
		}
		opts.maxAttempts = 3;
		opts.fullResponse = true;
		opts.json = true;

		const res = await request(`${envs.bazarrAddress}/${path}`, opts);
		if (res.statusCode < 200 || res.statusCode >= 300) {
			throw new Error(`Status code: ${res.statusCode}, Status message: ${res.statusMessage}`);
		} 
	
		return	[
			res.body, 
			res.statusCode
		];
		
	} catch (err) {
		logger.error("bazarrRequest: ", err);
	}
};

const notifyBazarr = async () => {
	try {
		logger.info(`Trigger ${capitalize(envs.importArr)} search`);
		const body = {};
		body[(envs.importArr === 'radarr') ? 'radarr_moviefile_id' : 'sonarr_episodefile_id'] = envs.videoId;
		const [ response, code ] = await bazarrRequest(
			`api/webhooks/${envs.importArr}`, { 
				method: 'POST',
				body: body,
			}
		);
		if (code === 200) {
			logger.info('Bazarr webhook triggered.');
			return true;
		}
		
		return false;
		
	} catch (err) {
		logger.error("notifyBazarr: ", err);
	}
};

const bazarrSystemTasks = async (taskId) => {
	try {
		const taskName = capitalize(taskId).replace('_', ' ');
		logger.info(`Run Bazarr task: ${taskName}`);
		const [ response, code ] = await bazarrRequest(
			`api/system/tasks`, { 
				method: 'POST',
				body: { taskid: taskId},
			}
		);
		if (code === 204) {
			logger.info(`Bazarr task ${taskName} triggered with success.`);
			return true;
		}
		
		return false;
		
	} catch (err) {
		logger.error("bazarrSystemTasks: ", err);
	}
};

const ruBazarrTasks = async () => {
	try {
		if (!envs.bazarrAddress || !envs.bazarrApiKey) {
			logger.warn(`Bazarr IP:PORT/API Key not found in .env. Skiping Bazarr tasks...`)
			return;
		}
		if (envs.importArr === 'sonarr') await bazarrSystemTasks('sync_episodes');
		await notifyBazarr();
		
	} catch (err) {
		logger.error("ruBazarrTasks: ", err);
	}
};

module.exports = {
	notifyBazarr,
	bazarrSystemTasks,
	ruBazarrTasks,
}