module.exports = require('./wsdebug-full.json').map((a) => {
	return [a[0], Buffer.from(a[1], 'base64')];
});
