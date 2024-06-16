const { WebSocketServer } = require('ws');
const querystring = require('querystring');
const url = require('url');
const { createTest } = require('./server-test');

function testWS(with_deflate) {
  let opts = {
    port: 3010,
    maxPayload: 1024*1024,
  };
  if (with_deflate) {
    opts.perMessageDeflate = {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Other options settable:
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Defaults to negotiated value.
      // Below options specified as default values.
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 512 // Size (in bytes) below which messages
      // should not be compressed if context takeover is disabled.
    };
  }

  let wss = new WebSocketServer(opts);

  // Would want this:
  // // Doing my own upgrade handling to early-reject invalid protocol versions
  // let onUpgrade = (req, socket, head) => {
  //   let query = querystring.parse(url.parse(req.url).query);
  //   if (query.ver !== '1') {
  //     console.log(`WS Client rejected (bad ver): ${req.url}`);
  //     socket.write('HTTP/1.1 400 Invalid Protocol\r\n\r\n');
  //     socket.end();
  //     socket.destroy();
  //     return;
  //   }

  //   wss.handleUpgrade(req, socket, head, function done(ws) {
  //     wss.emit('connection', ws, req);
  //   });
  // };
  // server.on('upgrade', onUpgrade);

  wss.on('connection', (socket, req) => {
    let test = createTest(function (buf, next) {
      socket.send(buf, next);
    });
    socket.on('close', test.onClose);
    socket.on('message', test.onMessage);
    socket.on('error', test.onError);
    test.start();
  });
}

exports.testPureWSRaw = testWS.bind(null, false);
exports.testPureWSDeflate = testWS.bind(null, true);
