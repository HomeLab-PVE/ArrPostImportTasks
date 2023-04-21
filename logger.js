const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const envs = require('./environments');
const path = require('path');
const { fileExistsSync } = require('./utils');

const customFormat = printf( ({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

const logFileName = () => {
	return path.join(path.dirname(envs.movieFilePath), path.basename(`${envs.movieFilePath}.post-import`));
};

let logFile = 'orphans';
if (envs.movieFilePath) {
	logFile = logFileName();
	for (let i = 2; fileExistsSync(logFile + '.log'); i++) {
		logFile = logFileName() + '-' + i;
	}
}

const logger = createLogger({
	level: 'info',
	format: combine(
		label({ label: `${envs.importArr}-${envs.videoId}`, message: true }),
		timestamp(),
		customFormat,
	),
	transports: [
		new transports.Console(),
		new transports.File({
			filename: logFile + '.log', 
		}),
	],
});

module.exports = {
	logger,
}