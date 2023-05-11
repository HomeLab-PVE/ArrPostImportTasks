const API_URL = 'https://apis.justwatch.com';
const request = require('requestretry');

class justWatch {
	constructor(options) {
		this._options = Object.assign({
			country: 'RO',
			language: 'ro',
			streamingProviders: ['nfx', 'dnp', 'hbm'],
			content: {
				id: null,
				query: null,
			},
			filters: {
				mediaType: ['MOVIE', 'SHOW'],
				releaseYear: {
					min: null,
					max: null,
				},
				limit: 20,
			},
			request: {
				maxAttempts: 3,
				fullResponse: true,
				json: true,
			}
		}, options);
		
		if (!this._options.content.id) {
			throw new Error(`TMDB or IMDB is missing. { content.id }`);
		}
		
		if (!this._options.content.query) {
			throw new Error(`Content query is missing. { content.query }`);
		}
		
		this._options.country = this._options.country.toUpperCase();
		this._options.language = this._options.language.toLowerCase();
		this._options.locale = this._options.language + '_' + this._options.country;
		this._options['idProvider'] = (this._options.content.id.startsWith('tt')) ? 'imdb' : 'tmdb';
		this.jwData = {};

	}
	
	async #jwRequest(url, requestOptions) {
		try {
			if (!requestOptions) {
				requestOptions = this._options.request;
			}
			const response = await request(url, requestOptions);
			if (response.statusCode < 200 || response.statusCode >= 300) {
				throw new Error(`Status code: ${response.statusCode}, Status message: ${response.statusMessage}`);
			}
			
			return response.body;
			
		} catch (err) {
			console.error("jwRequest: ", err);
		}
		
	}

	async #getPossibleIds() {
		try {
			return await this.#jwRequest(`${API_URL}/graphql`, 
			Object.assign({
				method: 'POST',
				body: {
					operationName: 'GetSearchTitles',
					variables: {
						country: this._options.country,
						language: this._options.language,
						first: this._options.filters.limit || 20,
						searchTitlesFilter: {
							searchQuery: this._options.content.query,
							objectTypes: this._options.filters.mediaType,
							packages: this._options.streamingProviders,
							releaseYear: this._options.filters.releaseYear,
							personId: null,
							presentationTypes: [],
							productionCountries: [],
							excludeProductionCountries: [],
							excludeIrrelevantTitles: false,
							excludeGenres: [],
							ageCertifications: [],
							genres: [],
							
						}, 
						sortRandomSeed: 0,
						searchTitlesSortBy: 'POPULAR',
					},
					query: "query GetSearchTitles($country: Country!, $searchTitlesFilter: TitleFilter, $searchAfterCursor: String, $searchTitlesSortBy: PopularTitlesSorting! = POPULAR, $first: Int! = 5, $language: Language!, $sortRandomSeed: Int! = 0, $profile: PosterProfile, $backdropProfile: BackdropProfile, $format: ImageFormat) {\n  popularTitles(\n    country: $country\n    filter: $searchTitlesFilter\n    after: $searchAfterCursor\n    sortBy: $searchTitlesSortBy\n    first: $first\n    sortRandomSeed: $sortRandomSeed\n  ) {\n    totalCount\n    pageInfo {\n      startCursor\n      endCursor\n      hasPreviousPage\n      hasNextPage\n      __typename\n    }\n    edges {\n      ...SearchTitleGraphql\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment SearchTitleGraphql on PopularTitlesEdge {\n  cursor\n  node {\n    id\n    objectId\n    objectType\n    content(country: $country, language: $language) {\n      title\n      fullPath\n      originalReleaseYear\n      scoring {\n        imdbScore\n        imdbVotes\n        tmdbScore\n        tmdbPopularity\n        __typename\n      }\n      posterUrl(profile: $profile, format: $format)\n      backdrops(profile: $backdropProfile, format: $format) {\n        backdropUrl\n        __typename\n      }\n      upcomingReleases(releaseTypes: [DIGITAL]) {\n        releaseDate\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n",
				},
				
			}, this._options.request));

			
		} catch (err) {
			console.error("getPossibleIds: ", err);
		}		
	}
	
	async #getRawData() {
		try {
			let posbileIds = await this.#getPossibleIds();
			const edges = posbileIds.data.popularTitles.edges;
			for (let i = 0; i < edges.length; i++) {
			   let jwNodeId = edges[i].node.objectId;
			   let jwNodetype = edges[i].node.objectType;
			   let response = await this.#jwRequest(`${API_URL}/content/titles/${jwNodetype.toLowerCase()}/${jwNodeId}/locale/${this._options.locale}`);
			   if (response && response.external_ids.find(obj => obj.external_id == this._options.content.id 
				&& obj.provider === this._options.idProvider)) {
					
				   this.jwData = response;
				   break;
			   }
			}
			
		} catch (err) {
			console.error("getRawData: ", err);
		}
	}
	
	async getStreamingProvidersIds() {
		try {
			await this.#getRawData();
			
			if (!this.jwData || !this.jwData.hasOwnProperty('offers')) {
				return false; 
			}
			
			this.result = {
				mediaType: null,
			}
			
			this.ids = {
				justwatch: null,
				streaming: {},
				tmdb: null,
				imdb: null,
				tmdb_history: [],
				imdb_history: [],
			}
			
			this.ids.justwatch = this.jwData.id
			this.result.mediaType = this.jwData.object_type;
			
			for (let externalId in this.jwData.external_ids) {
				let providerName = this.jwData.external_ids[externalId].provider;
				let providerId = this.jwData.external_ids[externalId].external_id;
				if (providerName === 'tmdb_latest' || providerName === 'imdb_latest') {
					this.ids[providerName.split('_')[0]] = providerId;
				}
				if (providerName === 'tmdb' || providerName === 'imdb') {
					this.ids[providerName + '_' + 'history'].push(providerId);
				}
			}
			
			for (let provider in this.jwData.offers) {
				const providerName = this.jwData.offers[provider].package_short_name;
				let providerId = null;
				if (this._options.streamingProviders.includes(providerName)) {
					if (providerName === 'nfx') {
						providerId = this.jwData.offers[provider].urls.standard_web.split('/title/').pop();
					}
					else if (providerName === 'dnp') {
						providerId = JSON.parse(JSON.parse(this.jwData.offers[provider].urls.deeplink_tizenos).action_data).id;
					}
					else if (providerName === 'hbm') {
						 providerId = 'urn:' + this.jwData.offers[provider].urls.standard_web.split('urn:').pop();
					}
				}
				if (providerId) {
					this.ids.streaming[providerName] = providerId;
				}
			}
			
			this.ids.streaming['count'] = Object.keys(this.ids.streaming).length;
			this.result['ids'] = this.ids;

			return this.result;
			
		} catch (err) {
			console.error("getStreamingProvidersIds: ", err);
		}
	}

}

module.exports = justWatch