require("dotenv").config();

let importArr = null;
if (process.env.sonarr_episodefile_id) importArr = 'sonarr' 
else if (process.env.radarr_movie_id) importArr = 'radarr';

const envs = {
	eventType: process.env.radarr_eventtype || process.env.sonarr_eventtype || null,
	importArr: importArr,
	videoId: process.env.radarr_movie_id || process.env.sonarr_episodefile_id || null,
	movieFilePath: process.env.radarr_moviefile_path || process.env.sonarr_episodefile_path || null,
	moviePath: process.env.radarr_movie_path || process.env.sonarr_series_path || null,
	movieFileRelativePath: process.env.radarr_moviefile_relativepath || process.env.sonarr_episodefile_relativepath || null,
	bazarrAddress: process.env.BAZARR_IP_PORT,
	bazarrApiKey: process.env.BAZARR_API_KEY,
	jellyfinAddress: process.env.JELLYFIN_IP_PORT,
	jellyfinApiKey: process.env.JELLYFIN_API_KEY,
};

module.exports = envs;

