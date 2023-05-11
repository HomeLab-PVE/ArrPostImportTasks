const justWatch = require('./JustWatch');
const disneyPlus = require('./DisneyPlus');


(async  () => {
	
	const jw = new justWatch({
		content: {
			//query: 'Black Widow',
			//id: 'tt3480822',
			query: 'Modern Family',
			id: 'tt1442437',
			
		},
	});
	const jwResult = await jw.getStreamingProvidersIds();
	console.log(jwResult);
	if (jwResult) {
		const providers = jwResult?.ids?.streaming;
		for (let provider in providers) {
			if (provider === 'dnp') {
				const dnp = new disneyPlus({ 
					id: providers[provider], 
					mediaType: jwResult.mediaType, 
				});
				const dnpMetadata = await dnp.getMetadata();
			}
		}
		//console.log(ids);
	}
	
	
	
})();
