const fs = require('fs');
const path = require('path');
const { SubtitleParser } = require('matroska-subtitles');
const { msToTime, fileExistsSync } = require('./../utils');
const { logger } = require('./../logger');

const searchSubsTracks = (lang, array) => {
	for (let i=0; i < array.length; i++) {
        if (array[i].language === lang) {
            return array[i];
        }
    }
	return false;
}

const extractSubtitles = (mkvPath, outputDir) => new Promise((resolve, reject) => {
	try {
		const dir = outputDir || path.dirname(mkvPath);
		const name = path.basename(mkvPath, path.extname(mkvPath));
		logger.info(`Searching for Romanian internal subtitle in ${mkvPath}`)
		
		const srtPath = function (language) {
			const languageSuffix = language ? '.' + language : ''
			return path.join(dir, name + languageSuffix + '.srt')
		}

		const tracks = new Map()
		const subs = new SubtitleParser()

		subs.once('tracks', tracks_ => {
			const roTracks = [];
			const roNames = ['rum', 'romanian', 'rom', 'ro'];
			for (let i = 0; i < roNames.length; i++) {
				let roTrack = searchSubsTracks(roNames[i], tracks_);
				if (roTrack !== false) {
					roTracks.push(roTrack);
					break;
				}
			}
			if (roTracks.length === 0) {
				logger.info('No Romanian internal subtitles found. Aborting...');
			}
			roTracks.forEach(track => {
				logger.info(`Found Romanian internal subtitle in ${name} on track ${track.number}. Waiting for SUBRIP...`)
				const language = 'rum';
				let subtitlePath = srtPath(language);
				for (let i = 2; fileExistsSync(subtitlePath); i++) {
					subtitlePath = language ? srtPath(language + '.' + i) : srtPath(i)
				}
				tracks.set(track.number, {
					index: 1,
					file: fs.createWriteStream(subtitlePath),
					language
				})
			})
		})

		subs.on('subtitle', (sub, trackNumber) => {
			const track = tracks.get(trackNumber)
			if (track) {
				track.file.write(`${track.index++}\r\n`)
				track.file.write(`${msToTime(sub.time)} --> ${msToTime(sub.time + sub.duration)}\r\n`)
				track.file.write(`${sub.text}\r\n\r\n`)
			} 
		})

		subs.on('finish', () => {
			const tracks_ = []
			tracks.forEach((track, i) => {
				track.file.end()
				tracks_.push({number: i, path: track.file.path, language: track.language})
				logger.info(`File saved successfully in ${track.file.path}`);
			})
			resolve(tracks_)
		})

		const file = fs.createReadStream(mkvPath)
		file.on('error', err => reject(err))
		file.pipe(subs)
				
	} catch (err) {
		logger.error("extractSubtitles: ", err);
	}
})

module.exports = extractSubtitles