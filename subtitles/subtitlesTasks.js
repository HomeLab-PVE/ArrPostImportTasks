const { logger } = require('./../logger');
const envs = require('./../environments');
const { convertExternalSubtitles, checkForExternalSubs, detectEncoding, checkExtractedSubtitles } = require('./convertSubtitles');
const extractSubtitles = require('./extractSubtitles');

const runsubtitlesTasks = async () => {
	logger.info("Checking for external subtitles next to video");
	if ((externalSubFilePaths = await checkForExternalSubs(envs)) !== false) {
		await convertExternalSubtitles(externalSubFilePaths);
	}
	logger.info("Checking for internal subtitles");
	try {
		if ((extractedSubtitles = await extractSubtitles(envs.movieFilePath))) {
			await checkExtractedSubtitles(extractedSubtitles);
		}
	} catch (err) {
		logger.error("Extract internal subtitles: ", err);
	}
};

module.exports = {
	runsubtitlesTasks,
}