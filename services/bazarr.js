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
		opts.retryDelay = 3000;
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
				body: { taskid: taskId , seriesid: '95'},
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

const bazarrSearchSubtitle = async ( opts = {} ) => {
	try {
		logger.info(`Trigger Bazarr subtitile index/search`);
		const key = (opts.type === 'movies') ? 'radarrid' : 'seriesid';
		if (!opts.searchId) {
			logger.warn(`We cannot search for subtitles because search id is missing`);
			return;
		}
		const [ response, code ] = await bazarrRequest(
			`api/${opts.type}`, { 
				method: 'PATCH',
				body: { 
					action: 'search-missing',
					[key]: opts.searchId,
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

const bazarrCheckSync = async () => {
	try {
		logger.info(`Waiting Bazarr to sync from ${capitalize(envs.importArr)}`);
		const type = (envs.importArr === 'radarr') ? 'movies' : 'series';
		const searchId = (type === 'movies') ? envs.videoId : process.env.sonarr_series_id;
		if (!searchId) {
			logger.warn(`We cannot wait for sync because search id is missing`);
			return false;
		}
		
		const data = {
			type: type,
			searchId: searchId,
		};
		
		const path = (type === 'movies') ? `movies?radarrid[]=${searchId}` : `episodes?seriesid[]=${searchId}`;
		
		let awaitMs = 100;
		for (let i = 0; i < awaitMs; i++) { 
			await new Promise(r => setTimeout(r, 2500));
			let [ response, code ] = await bazarrRequest(`api/${path}`);
			if (code === 200 && type === 'movies') {
				if (response.data && response.data.length > 0) {
					return data;
				}
			} 
			else if (code === 200 && type === 'series') {
				let wanted = response.data.find(obj => obj.episode_file_id == envs.videoId);
				if (wanted) {
					return data;
				}
			}
		}
		
		logger.warn(`Synchronization from ${capitalize(envs.importArr)} failed`);
		
		return false;
		
	} catch (err) {
		logger.error("bazarrCheckSync: ", err);
	}
};

const ruBazarrTasks = async () => {
	try {
		if (!envs.bazarrAddress || !envs.bazarrApiKey) {
			logger.warn(`Bazarr IP:PORT/API Key not found in .env. Skiping Bazarr tasks...`)
			return;
		}
		
		if (envs.importArr === 'sonarr') await bazarrSystemTasks('sync_episodes');
		const syncData = await bazarrCheckSync();
		if (syncData) await bazarrSearchSubtitle(syncData);
		
	} catch (err) {
		logger.error("ruBazarrTasks: ", err);
	}
};

module.exports = {
	ruBazarrTasks,
}