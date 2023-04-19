const request = require('requestretry');
const envs = require('./environments');

const notifyBazarr = async () => {
	try {
		if (!envs.bazarrAddress || !envs.bazarrApiKey) {
			console.log(`Bazarr IP:PORT/API Key not found in .env. Skiping...`)
			return false;
		}		
		const options = {
			headers: {
				'x-api-key': `${envs.bazarrApiKey}`,
			},
			body: {},
			json: true,
			maxAttempts: 3,
			fullResponse: false,
		}
		
		const arrKeyId = (envs.importArr === 'radarr') ? 'radarr_moviefile_id' : 'sonarr_episodefile_id';
		options.body[arrKeyId] = envs.videoId;
		
		return await request.post(`${envs.bazarrAddress}/api/webhooks/${envs.importArr}`, options);
		
	} catch (err) {
		console.error("notifyBazarr: ", err);
	}
};

module.exports = {
	notifyBazarr,
}