const { logger } = require('./logger');
const { isRequierdEnvs, ignoreFile } = require('./functions');
const { runsubtitlesTasks } = require('./subtitles/subtitlesTasks');
const { ruBazarrTasks } = require('./services/bazarr');

if (!isRequierdEnvs()) process.exit();

(async function () {
	logger.info(`Starting post import tasks`);
	await ignoreFile();
	//await runsubtitlesTasks();
	await ruBazarrTasks();
	await ignoreFile('delete');
	logger.info(`Finished tasks for video ID`);
})()