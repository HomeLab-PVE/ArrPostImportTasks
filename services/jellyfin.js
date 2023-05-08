const request = require('requestretry');
const envs = require('./../environments');
const { logger } = require('./../logger');
const { insertSpacesCamel } = require('./../utils');

const jellyRequest = async (path, opts = {}) => {
	try {
		if (!envs.jellyfinAddress || !envs.jellyfinApiKey) {
			logger.warn(`Jellyfin IP:PORT/API Key not found in Skiping...`)
			return false;
		}
		opts['headers'] = {
			"Authorization": `MediaBrowser Token=${envs.jellyfinApiKey}`
		}
		opts.maxAttempts = 3;
		opts.fullResponse = true;
		opts.json = true;

		const res = await request(`${envs.jellyfinAddress}/${path}`, opts);
		if (res.statusCode < 200 || res.statusCode >= 300) {
			throw new Error(`Status code: ${res.statusCode}, Status message: ${res.statusMessage}`);
		} 
		return	[
			res.body, 
			res.statusCode
		];
		
	} catch (err) {
		logger.error("jellyRequest: ", err);
	}
};

const jellyfinSystemTasks = async (taskId) => {
	try {
		const taskName = insertSpacesCamel(taskId);
		logger.info(`Run Jellyfin system task: ${taskName}`);
		const [ tasks ] = await jellyRequest('ScheduledTasks');
		for (let key in tasks) {
			if (tasks[key].Key === taskId) {
				if (tasks[key].State === 'Running') {
					logger.info(`Jellyfin task ${taskName} is already running. Current progress: ${tasks[key]. CurrentProgressPercentage}%`);
					return true;
				}
				const [ response, code ] = await jellyRequest(
					`ScheduledTasks/Running/${tasks[key].Id}`, 
					{ method: 'POST' }
				);
				if (code === 204) {
					logger.info(`Jellyfin task ${taskName} triggered with success.`);
					return true;
				}
			} 
		}
		
		return false;
		
	} catch (err) {
		logger.error("jellyfinSystemTasks: ", err);
	}
};

const jellyfinGetLibrariesIds= async () => {
	try {
		
		logger.info(`Geting Jellyfin libraries ids`);
		
		let parentIds = [];
		const requestPath = `Users/${envs.jellyfinUserId}/Items?SortBy=DateCreated&SortOrder=Descending&enableTotalRecordCount=false&enableImages=false`;
		const libraryType = (envs.importArr === 'radarr') ? 'movies' : 'tvshows';
		
		let [ response, code ] = await jellyRequest(`${requestPath}`);
		if (code === 200 && response.Items) {
			response.Items.forEach(function (obj) {
				if (obj.CollectionType == libraryType) {
					parentIds.push(obj.Id)
				}
			});
			if (parentIds.length > 0 ) {
				logger.info(`Found ${parentIds.length} ${libraryType} libraries ids`);
				return parentIds;
			} 
		}
		
		logger.warn(`No Jellyfin libraries ids found`);
		
		return false;
		
	} catch (err) {
		logger.error("jellyfinGetLibrariesIds: ", err);
	}
};

const jellyfinDiscoverMedia = async () => {
	try {
		if (!envs.jellyfinUserId) {
			logger.warn(`Jellyfin User Id not found in .env. Skiping task...`)
			return;
		}
		
		const librariesIds = await jellyfinGetLibrariesIds();
		if (librariesIds) {
			logger.info(`Waiting Jellyfin to discover media`);
			const requestPath = `Users/${envs.jellyfinUserId}/Items?SortBy=DateCreated&SortOrder=Descending&Limit=30&ParentId=${librariesIds.join(',')}&fields=Path&enableTotalRecordCount=false&enableImages=false`;
			
			let checks = 30;
			for (let i = 0; i < checks; i++) { 
				let [ response, code ] = await jellyRequest(`${requestPath}`);
				if (code === 200 && response.Items.find(obj => obj.Path == envs.movieFilePath)) {
					logger.info(`Item ${envs.movieFilePath} discovered by Jellyfin`);
					return true;
				}
				await new Promise(r => setTimeout(r, 10500));
			}
		}
		
		logger.warn(`Jellyfin discover item ${envs.movieFilePath} faild`);
		return false;
		
	} catch (err) {
		logger.error("jellyfinDiscoverMedia: ", err);
	}
};

const runJellyfinTasks = async () => {
	try {
		if (!envs.jellyfinAddress || !envs.jellyfinApiKey) {
			logger.warn(`Jellyfin IP:PORT/API Key not found in .env. Skiping tasks...`)
			return;
		}
		await jellyfinDiscoverMedia();
		if (envs.importArr === 'sonarr') {
			await jellyfinSystemTasks('CPBIntroSkipperDetectIntroductions');
		}
		await jellyfinSystemTasks('RefreshChapterImages');
		
	} catch (err) {
		logger.error("runJellyfinTasks: ", err);
	}
};

module.exports = {
	runJellyfinTasks,
}