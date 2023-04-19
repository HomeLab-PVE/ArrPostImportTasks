const fs = require('fs');
const path = require('path');
const languageEncoding = require("detect-file-encoding-and-language");
const iconv = require('iconv-lite');
const { fileExists } = require('./utils');

const detectEncoding = async (filePath) => {
	try {
		return await languageEncoding(filePath);
	} catch (err) {
		console.error("detectEncoding: ", err);
	}
};

const checkForExternalSubs = async (envs) => {
	let arr = envs.movieFileRelativePath.split(".");
	const extension = arr.pop();
	const movieNameNoExtension = arr.join(".");
	const subRips = ['srt', 'sub'];
	for (let i = 0; i < subRips.length; i++) {
		let filePath = path.join(envs.moviePath, `${movieNameNoExtension}.${subRips[i]}`);
		if (await fileExists(filePath)) {
			console.log(`Found external sub: ${filePath}`)
			return {
				filePath: filePath,
				moviePath: envs.moviePath,
				fileNameNoExtension: movieNameNoExtension,
				extension: subRips[i],
			};
		}
	}
	console.log(`No external subs found in ${envs.moviePath}`)
	return false;
};

const infoLanguageEncoding = (data) => {
	if (!data) {
		return;
	}
	info = [];
	info.push(`Detected language: ${data.language.toUpperCase()} with confidence ${data.confidence.language}`);
	info.push(`Detected encoding: ${data.encoding} with confidence ${data.confidence.encoding}`);
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
		console.log(`Buffer converted from ${originalEncoding} to UTF-8 encoding`);
		await fs.promises.writeFile(saveLocation, utf8Buffer);
		console.log(`File saved successfully in ${saveLocation}`);
		return true;
	} catch (err) {
		console.error("convertSubtitles: ", err);
	}
}

const convertExternalSubtitles = async (opts = {}) => {
	try {
		const detectedEnconding = await detectEncoding(opts.filePath);
		if (!detectedEnconding) {
			return;
		}
		if (detectedEnconding.language !== 'romanian') {
			console.log('Detected language is not Romanian. Abort...');
			return;
		}
		console.log(infoLanguageEncoding(detectedEnconding).join('\n'));
		
		let saveLocation = path.join(opts.moviePath, `${opts.fileNameNoExtension}.ro.${opts.extension}`);
		
		if (await convertSubtitles(opts.filePath, detectedEnconding.encoding, saveLocation)) {
			return true;
		}
		
	} catch (err) {
		console.error("convertExternalSubtitles: ", err);
	}
};

const checkExtractedSubtitles = async (extractedSubtitles = []) => {
	try {
		for (let i = 0; i < extractedSubtitles.length; i++) {
			let filePath = extractedSubtitles[i].path;
			console.log(`Validating the extracted subtitle ${filePath}`);
			let detectedEncondingAndLanguage = await detectEncoding(filePath);
			console.log(infoLanguageEncoding(detectedEncondingAndLanguage).join('\n'));
			let encoding = detectedEncondingAndLanguage.encoding.toLowerCase();
			if (encoding === 'utf-8' && detectedEncondingAndLanguage.language === 'romanian') {
				console.log(`Everything is fine.`);
				return;
			} else {
				if (detectedEncondingAndLanguage.language !== 'romanian') {
					await fs.promises.unlink(filePath, {
						force: true,
					});
					console.log(`Subtitle ${filePath} deleted because detected language is not Romanian.`);
				}
				if (encoding !== 'utf-8') {
					console.log(`Subtitle neads to be converted to UTF-8`);
					if (await convertSubtitles(filePath, detectedEncondingAndLanguage.encoding)) {
						console.log(`Everything is fine now.`);
					}
				}
			}
		}
		
		return;
		
	} catch (err) {
		console.error("checkExtractedSubtitles: ", err);
	}
};
	
module.exports = {
	convertExternalSubtitles, 
	detectEncoding, 
	checkForExternalSubs, 
	checkExtractedSubtitles, 
}
