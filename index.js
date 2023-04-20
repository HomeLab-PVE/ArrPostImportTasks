const envs = require('./environments');
const { logger } = require('./logger');
const { checkEnvs } = require('./utils');
const { convertExternalSubtitles, checkForExternalSubs, detectEncoding, checkExtractedSubtitles } = require('./convertSubtitles');
const extractSubtitles = require('./extractSubtitles');
const { notifyBazarr } = require('./notify');

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
	logger.info("Checking for external subtitles");
	let externalSubFilePaths;
	let extractedSubtitles;
	if (externalSubFilePaths = await checkForExternalSubs(envs) ) {
		await convertExternalSubtitles(externalSubFilePaths);
	}
	logger.info("Checking for internal subtitles");
	try {
		if (extractedSubtitles = await extractSubtitles(envs.movieFilePath) ) {
			await checkExtractedSubtitles(extractedSubtitles);
		}
	} catch (err) {
		logger.error("Extract internal subtitles: ", err);
	}
	logger.info(`Notify Bazarr at ${envs.bazarrAddress}`)
	await notifyBazarr();
	logger.info(`Finished tasks for video ID: ${envs.importArr}-${envs.videoId}`);
})()