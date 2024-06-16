const {
  testExpressWSRaw,
  testExpressWSDeflate,
} = require('./server-express-ws.js');
const {
  testPureWSRaw,
  testPureWSDeflate,
} = require('./server-pure-ws.js');
const {
  testPureUWSRaw,
  testPureUWSDeflate,
} = require('./server-pure-uwebsocket.js');

// Tests with 2 clients

if (0) {
  // 3.98 CPU/s
  // 1.6L/s
  testExpressWSRaw();
} else if (0) {
  // 4.6 CPU/s
  // 1.2L/s
  // 25% data size down, 93% up
  testExpressWSDeflate();
} else if (0) {
	// 3.95 CPU/s
	// 1.80L/s
	// 2.19 CPU/L
	testPureWSRaw();
} else if (0) {
	// 4.67 CPU
	// 1.24L/s
	// 3.76 CPU/L
	testPureWSDeflate();
} else if (0) {
	// Note: was faster without the setImmediate, but that's an unfair comparison
	// 3.75 CPU
	// 1.80L/s
	// 2.08 CPU/L
	testPureUWSRaw();
} else if (1) {
	// 21% data size done, 93% up
	// 2.98 CPU
	// 0.50L/s
	// 5.96 CPU/L
	testPureUWSDeflate();
}
