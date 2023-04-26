const { logger } = require('./logger');
const { isRequierdEnvs } = require('./functions');
const { runSubtitlesTasks } = require('./subtitles/subtitlesTasks');
const { runBazarrTasks } = require('./services/bazarr');
const { runJellyfinTasks } = require('./services/jellyfin');

if (!isRequierdEnvs()) process.exit();

(async function () {
	logger.info(`Starting post import tasks`);
	await runSubtitlesTasks();
	await runBazarrTasks();
	await runJellyfinTasks();
	logger.info(`Finished post import tasks`);
})()