const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
let bizNetworkConnection, businessNetworkDefinition = null

async function connect() {
	if (businessNetworkDefinition == null) {
		const cardname = 'admin@land-registry-network';
		bizNetworkConnection = await new BusinessNetworkConnection();
        businessNetworkDefinition = await bizNetworkConnection.connect(cardname);
	} else console.log("Already connected");

	return {bizNetworkConnection,businessNetworkDefinition};
}

module.exports = {
    connect
};