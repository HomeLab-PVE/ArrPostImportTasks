const fs = require('fs');
const z = require('zero-fill');

const checkEnvs = (obj) => {
	const missing = [];
	for (let env in obj) {
        if (obj[env] === null)
			missing.push(env);
    }
	if (missing.length !== 0) {
		return missing;
	}
	return false;
};

function capitalize(str) {
	const lower = str.toLowerCase();
	return str.charAt(0).toUpperCase() + lower.slice(1);
}

const fileExists = async (path) => !!(await fs.promises.stat(path).catch((e) => false));

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

module.exports = {
	checkEnvs,
	fileExists,
	fileExistsSync,
	msToTime,
	capitalize,
}
