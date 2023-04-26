const envs = require('./environments');
const { logger } = require('./logger');
const { checkEnvs } = require('./utils');
const { runsubtitlesTasks } = require('./subtitles/subtitlesTasks');
const { ruBazarrTasks } = require('./services/bazarr');

const missingEnvs = checkEnvs(envs);
if (missingEnvs !== false) {
	logger.warn(`Missing environments: ${missingEnvs.join()}. Exiting...`);
	process.exit();
} else {
	if (envs.eventType !== 'Download') {
		logger.warn('Event type is not import. Exiting...');
		process.exit();
	}
}

(async function () {
	logger.info(`Starting post import tasks for video ID: ${envs.importArr}-${envs.videoId}`)
	await runsubtitlesTasks();
	await ruBazarrTasks();
	logger.info(`Finished tasks for video ID: ${envs.importArr}-${envs.videoId}`);
})()