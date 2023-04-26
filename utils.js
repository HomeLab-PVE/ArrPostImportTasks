const fs = require('fs');
const path = require('path');
const z = require('zero-fill');

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
}

const fileExistsSync = (path) => {
	if (fs.existsSync(path)) {
		return true;
	}
	return false;
};

const msToTime = (s) => {
	const ms = s % 1000
	s = (s - ms) / 1000
	const secs = s % 60
	s = (s - secs) / 60
	const mins = s % 60
	const hrs = (s - mins) / 60

	return z(2, hrs) + ':' + z(2, mins) + ':' + z(2, secs) + ',' + z(3, ms);
}

const insertSpacesCamel = (str) => {
    str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
    str = str.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    return str;
}

const fileExists = async (path) => !!(await fs.promises.stat(path).catch((e) => false));

module.exports = {
	fileExists,
	fileExistsSync,
	msToTime,
	capitalize,
	insertSpacesCamel,
}
