const assert = require('assert');
const WebSocket = require('ws');

const loop = true;

const debug_data = require('./debug_data.js');
let raw_read = 0;
let raw_write = 0;
for (let ii = 0; ii < debug_data.length; ++ii) {
  if (debug_data[ii][0] === 'R') {
    raw_write += debug_data[ii][1].length;
  } else {
    raw_read += debug_data[ii][1].length;
  }
}

let count = 0;
function doTest() {
  const ws = new WebSocket('ws://localhost:3010/ws?ver=1');

  let got_error = false;
  ws.on('error', function (err) {
    console.error(err);
    got_error = true;
  });

  let idx = 0;
  let closed = false;
  function pump() {
    if (closed) {
      return;
    }
    if (idx === debug_data.length) {
      // console.log('All handled, closing...');
      ws.close();
      closed = true;
      return;
    }
    if (debug_data[idx][0] === 'S') {
      return;
    }
    ws.send(debug_data[idx][1]);
    // console.log(`Sent #${idx}`);
    idx++;
    pump();
  }

  ws.on('open', function open() {
    // console.log('Connected.');
    pump();
  });

  ws.on('message', function message(data) {
    assert(debug_data[idx][0] === 'S');
    assert(data.compare(debug_data[idx][1]) === 0);
    // console.log(`Received #${idx}`);
    idx++;
    pump();
  });

  ws.on('close', function () {
    // eslint-disable-next-line no-underscore-dangle
    let bw = ws._sender?._socket?.bytesWritten;
    // eslint-disable-next-line no-underscore-dangle
    let br = ws._sender?._socket?.bytesRead;
    if (bw) {
      if (!count) {
        ++count;
        console.log(`Read ${(br/1024).toFixed(1)}KB (${(br/raw_read*100).toFixed(0)}%),` +
          ` Wrote ${(bw/1024).toFixed(1)}KB (${(bw/raw_write*100).toFixed(0)}%)`);
      }
    }
    if (!closed) {
      closed = true;
      console.log('Other side closed');
    }
    if (got_error) {
      setTimeout(doTest, 100);
    } else {
      if (loop) {
        doTest();
      }
    }
  });
}
doTest();
