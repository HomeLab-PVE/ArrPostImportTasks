const request = require('requestretry');
const envs = require('./environments');
const { logger } = require('./logger');

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
			throw new Error("statusMessage=" + res.statusMessage);
		} 
	
		return	[
			res.body, 
			res.statusCode
		];
		
	} catch (err) {
		logger.error("jellyRequest: ", err);
	}
};

const runIntroSkipperTask = async () => {
	try {
		const [ tasks ] = await jellyRequest('ScheduledTasks');
		for (let key in tasks) {
			if (tasks[key].Key === 'CPBIntroSkipperDetectIntroductions') {
				const [ response, code ] = await jellyRequest(
					`ScheduledTasks/Running/${tasks[key].Id}`, 
					{ method: 'POST' }
				);
				if (code === 204) {
					console.log(`Task id ${tasks[key].Id} started. Description: Analyzes the audio to find introduction sequences.`);
					return true;
				}
			} 
		}
		return false;
	} catch (err) {
		logger.error("runIntroSkipperTask: ", err);
	}
};

(async function () {
	console.log(await runIntroSkipperTask());
	//http://192.168.90.2:8096/api-docs/swagger/index.html
	
})()
module.exports = {
	jellyRequest,
}