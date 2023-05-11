const API_URL = 'https://disney.content.edge.bamgrid.com';
const API_VERSION = '5.1';
const request = require('requestretry');

class DisneyPlus {
	constructor(options) {
		this._options = {
			id: options.id || null,
			mediaType: options.mediaType || null,
			country: options.country || 'RO',
			language: options.language || 'ro',
		}
		
		if (!this._options.id) {
			throw new Error(`Id is missing. { id }`);
		}
		
		if (!this._options.mediaType) {
			throw new Error(`Media type is missing. { mediaType }`);
		}
		
	}
	
	async #dnpReequest(url) {
		try {
			const requestOptions = {
				maxAttempts: 3,
				fullResponse: true,
				json: true,
			}
			const response = await request(url, requestOptions);
			if (response.statusCode < 200 || response.statusCode >= 300) {
				throw new Error(`Status code: ${response.statusCode}, Status message: ${response.statusMessage}`);
			}
			
			return response.body;
			
		} catch (err) {
			console.error("dnpReequest: ", err);
		}
	}
	
	async getMetadata() {
		try {
			
			if (this._options.mediaType == 'movie') {
				this.dmc = 'DmcVideoBundle';
				this.maturity = '1499';
				this.encodedType = 'encodedFamilyId';
			}
			else if (this._options.mediaType === 'show') {
				this.dmc = 'DmcSeriesBundle';
				this.maturity = '1850';
				this.encodedType = 'encodedSeriesId';
			}
			this.bundleUrl = `${API_URL}/svc/content/${this.dmc}/version/${API_VERSION}/region/${this._options.country}/audience/k-false,l-true/maturity/${this.maturity}/language/${this._options.language}/${this.encodedType}/${this._options.id}`;
			this.response = await this.#dnpReequest(this.bundleUrl);
			
			console.log(this.bundleUrl);
			
			this.path = (this._options.mediaType == 'movie') ? 'video' : 'series';
			this.texts = this.response?.data[this.dmc][this.path]?.text;
			this.images = this.response?.data[this.dmc][this.path]?.image;
			this.program = (this._options.mediaType == 'movie') ? 'program' : 'series';
			
			this.metadata = {
				providerShort: 'dnp',
				providerNicename: 'Disney Plus',
				providerId: this._options.id,
				mediaType: this._options.mediaType,
				title: {
					full: {
						content: this.texts?.title?.full[this.program]?.default?.content,
						language: this.texts?.title?.full[this.program]?.default?.language,
					}
				},
				description: {
					full: {
						content: this.texts?.description?.full[this.program]?.default?.content,
						language: this.texts?.description?.full[this.program]?.default?.language,
					}, 
					medium: {
						content: this.texts?.description?.medium[this.program].default?.content,
						language: this.texts?.description?.medium[this.program].default?.language,
					}, 
					short: {
						content: this.texts?.description?.brief[this.program].default?.content,
						language: this.texts?.description?.brief[this.program].default?.language,
					}, 
				}
			}
			
			if (this._options.mediaType === 'show') {
				this.metadata.episodes = [];
				this.seasons = this.response?.data?.DmcSeriesBundle?.seasons?.seasons;
				for (let s = 0; s < this.seasons.length; s++) {
					let seasonId = this.seasons[s].seasonId;
					let seasonUrl = `${API_URL}/svc/content/DmcEpisodes/version/${API_VERSION}/region/${this._options.country}/audience/k-false,l-true/maturity/${this.maturity}/language/${this._options.language}/seasonId/${seasonId}/pageSize/60/page/1`;
					let seasonData = await this.#dnpReequest(seasonUrl);
					let episodes = seasonData?.data?.DmcEpisodes?.videos;
					for (let e = 0; e < episodes.length; e++) {
						this.metadata.episodes.push({
							seasonNumber: episodes[e].seasonSequenceNumber,
							episodeNumber: episodes[e].episodeSequenceNumber,
							title: {
								full: {
									content: episodes[e].text?.title?.full?.program?.default?.content,
									language: episodes[e].text?.title?.full?.program?.default?.language,
								}
							},
						});
						
						//console.log(episodes.length)
					}
				}

				// test
				for (let i = 0; i < this.metadata.episodes.length; i++) {
					console.log(this.metadata.episodes[i].seasonNumber + 'x' +this.metadata.episodes[i].episodeNumber 
					+ '-' + this.metadata.episodes[i].title.full.content + '-' + this.metadata.episodes[i].title.full.language)
				}
			}
			//console.log(this.text)
			//console.log(this.images)
			//console.log(this.metadata)
			
			
		} catch (err) {
			console.error("getMetadata: ", err);
		}
	}
}

module.exports = DisneyPlus