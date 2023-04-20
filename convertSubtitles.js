const fs = require('fs');
const path = require('path');
const languageEncoding = require("detect-file-encoding-and-language");
const iconv = require('iconv-lite');
const { fileExists, capitalize } = require('./utils');
const { logger } = require('./logger');

const detectEncoding = async (filePath) => {
	try {
		return await languageEncoding(filePath);
	} catch (err) {
		logger.error("detectEncoding: ", err);
	}
};

const checkForExternalSubs = async (envs) => {
	try {
		let arr = envs.movieFileRelativePath.split(".");
		const extension = arr.pop();
		const movieNameNoExtension = arr.join(".");
		const subRips = ['srt', 'sub'];
		for (let i = 0; i < subRips.length; i++) {
			let filePath = path.join(envs.moviePath, `${movieNameNoExtension}.${subRips[i]}`);
			if (await fileExists(filePath)) {
				logger.info(`Found external sub: ${filePath}`)
				return {
					filePath: filePath,
					moviePath: envs.moviePath,
					fileNameNoExtension: movieNameNoExtension,
					extension: subRips[i],
				};
			}
		}
		logger.info(`No external subs found in ${envs.moviePath}`)
		return false;
	} catch (err) {
		logger.error("checkForExternalSubs: ", err);
	}
};

const infoLanguageEncoding = (data) => {
	if (!data) {
		return;
	}
	info = [];
	info.push(`Detected language: ${capitalize(data.language)} with confidence: ${data.confidence.language}`);
	info.push(`Detected encoding: ${data.encoding} with confidence: ${data.confidence.encoding}`);
	return info;
}

const convertSubtitles = async (filePath, originalEncoding, saveLocation) => {
	try {
		if (!saveLocation) {
			saveLocation = filePath;
		}
		const fileBuffer = await fs.promises.readFile(filePath);
		const fileContent = iconv.decode(fileBuffer, originalEncoding);
		const utf8Buffer = iconv.encode(fileContent, 'utf-8');
		logger.info(`File buffer converted from ${originalEncoding} to UTF-8 encoding`);
		await fs.promises.writeFile(saveLocation, utf8Buffer);
		logger.info(`File saved successfully in ${saveLocation}`);
		return true;
	} catch (err) {
		logger.error("convertSubtitles: ", err);
	}
}

const convertExternalSubtitles = async (opts = {}) => {
	try {
		const detectedEnconding = await detectEncoding(opts.filePath);
		if (!detectedEnconding) {
			return;
		}
		if (detectedEnconding.language !== 'romanian') {
			logger.info('Detected language is not Romanian. Abort...');
			return;
		}
		logger.info(infoLanguageEncoding(detectedEnconding).join('\n'));
		
		let saveLocation = path.join(opts.moviePath, `${opts.fileNameNoExtension}.ro.${opts.extension}`);
		
		if (await convertSubtitles(opts.filePath, detectedEnconding.encoding, saveLocation)) {
			return true;
		}
		
	} catch (err) {
		logger.error("convertExternalSubtitles: ", err);
	}
};

const checkExtractedSubtitles = async (extractedSubtitles = []) => {
	try {
		for (let i = 0; i < extractedSubtitles.length; i++) {
			let filePath = extractedSubtitles[i].path;
			logger.info(`Validating the extracted subtitle ${filePath}`);
			let detectedEncondingAndLanguage = await detectEncoding(filePath);
			logger.info(infoLanguageEncoding(detectedEncondingAndLanguage).join('\n'));
			let encoding = detectedEncondingAndLanguage.encoding.toLowerCase();
			if (encoding === 'utf-8' && detectedEncondingAndLanguage.language === 'romanian') {
				logger.info(`Everything is fine.`);
				return;
			} else {
				if (detectedEncondingAndLanguage.language !== 'romanian') {
					await fs.promises.unlink(filePath, {
						force: true,
					});
					logger.info(`Subtitle ${filePath} deleted because detected language is not Romanian.`);
				}
				if (encoding !== 'utf-8') {
					logger.info(`Subtitle neads to be converted to UTF-8`);
					if (await convertSubtitles(filePath, detectedEncondingAndLanguage.encoding)) {
						logger.info(`Everything is fine now.`);
					}
				}
			}
		}
		
		return;
		
	} catch (err) {
		logger.error("checkExtractedSubtitles: ", err);
	}
};
	
module.exports = {
	convertExternalSubtitles, 
	detectEncoding, 
	checkForExternalSubs, 
	checkExtractedSubtitles, 
}
