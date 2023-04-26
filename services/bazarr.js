const request = require('requestretry');
const envs = require('./../environments');
const { logger } = require('./../logger');
const { capitalize } = require('./../utils');

const bazarrRequest = async (path, opts = {}) => {
	try {
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

const bazarrSystemTasks = async (taskId) => {
	try {
		const taskName = capitalize(taskId).replace('_', ' ');
		logger.info(`Run Bazarr system task: ${taskName}`);
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

const bazarrSearchSubtitle = async (taskId) => {
	try {
		logger.info(`Trigger Bazarr subtitile index/search`);
		const type = (envs.importArr === 'radarr') ? 'movies' : 'series';
		const key = (type === 'movies') ? 'radarrid' : 'seriesid';
		const searchId = (type === 'movies') ? envs.videoId : process.env.sonarr_series_id;
		if (!searchId) {
			logger.warn(`We cannot search for subtitles because search id is missing`);
			return;
		}
		const [ response, code ] = await bazarrRequest(
			`api/${type}`, { 
				method: 'PATCH',
				body: { 
					action: 'search-missing',
					[key]: searchId,
				},
			}
		);
		if (code === 204) {
			logger.info(`Bazarr subtitile index/search triggered with success.`);
			return true;
		}
		
		return false;
		
	} catch (err) {
		logger.error("bazarrSearchSubtitle: ", err);
	}
};

const ruBazarrTasks = async () => {
	try {
		if (!envs.bazarrAddress || !envs.bazarrApiKey) {
			logger.warn(`Bazarr IP:PORT/API Key not found in .env. Skiping Bazarr tasks...`)
			return;
		}
		if (envs.importArr === 'sonarr') await bazarrSystemTasks('sync_episodes');
		await bazarrSearchSubtitle();
		
	} catch (err) {
		logger.error("ruBazarrTasks: ", err);
	}
};

module.exports = {
	ruBazarrTasks,
}