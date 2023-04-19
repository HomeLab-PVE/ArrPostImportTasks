const envs = require('./environments');
const { checkEnvs } = require('./utils');
const { convertExternalSubtitles, checkForExternalSubs, detectEncoding, checkExtractedSubtitles } = require('./convertSubtitles');
const extractSubtitles = require('./extractSubtitles');
const { notifyBazarr } = require('./notify');

const missingEnvs = checkEnvs(envs);
if (missingEnvs !== false) {
	console.log(`Missing environments: ${missingEnvs.join()}. Exiting...`);
	process.exit(0);
} else {
	if (envs.eventType !== 'Download') {
		console.log('Event type is not import. Exiting...');
		process.exit(0);
	}
}

(async function () {
	console.log(`Staring post import tasks for video ID: ${envs.importArr}-${envs.videoId}`)
	console.log("Checking for external subtitles");
	let externalSubFilePaths;
	if (externalSubFilePaths = await checkForExternalSubs(envs) ) {
		await convertExternalSubtitles(externalSubFilePaths);
	}
	console.log("Checking for internal subtitles");
	const extractedSubtitles = await extractSubtitles (envs.movieFilePath, envs.moviePath);
	await checkExtractedSubtitles(extractedSubtitles);
	console.log('Notify Bazarr')
	const bazarrResponse = await notifyBazarr();
	console.log((bazarrResponse == '') ? `Bazarr was successfully notified at ${envs.bazarrAddress}` : bazarrResponse);
	console.log(`Finished tasks for video ID: ${envs.importArr}-${envs.videoId}`)

		
})()









