const assert = require('assert');
const uws = require('uWebSockets.js');
const querystring = require('querystring');
const url = require('url');
const { createTest } = require('./server-test');

function testWS(with_deflate) {
	let app = uws.App();

	app.ws('/ws', {
		closeOnBackpressureLimit: 1,
		compression: with_deflate ? 3 : 0,
		maxPayloadLength: 1024*1024,
		message: function (ws, message, isBinary) {
			assert(isBinary);
			ws.my_test.onMessage(message);
		},
		dropped: function () {
			console.log('dropped');
		},
		open: function (ws) {
			ws.my_test = createTest(function (buf, next) {
				let ret = ws.send(buf, true, with_deflate);
				assert(ret === 1);
				setImmediate(next);
			});
			ws.my_test.start();
		},
		close: function (ws, code, message) {
			// Note: get 1006,'Received too big message' here (*NOT* in error handler!) if the client sends something too big
			if (message.length) {
				console.log('close', code, Buffer.from(message).toString());
			}
			ws.my_test.onClose();
		},
		error: function (ws, err) {
			ws.my_test.onError(err);
		},
	});

	app.listen(3010, function () {
		console.log('Server listening');
	});
}

exports.testPureUWSRaw = testWS.bind(null, false);
exports.testPureUWSDeflate = testWS.bind(null, true);
