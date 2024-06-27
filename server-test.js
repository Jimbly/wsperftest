const assert = require('assert');
const debug_data = require('./debug_data');

// set to low number (~100ms) to output whenever a loop
// finishes (single-client mode), otherwise use ~5s
const STATS_TIME = 100;

let stats = {
  send_bytes: 0,
  send_messages: 0,
  recv_bytes: 0,
  recv_messages: 0,
  loops: 0,
  cpus: 0,
};
let last_stats = {
  ...stats
};
let start = Date.now();
let last_time = start;
function dostats() {
  let now = Date.now();
  let dt = (now - last_time)/1000;
  let full_dt = (now - start)/1000;
  let recent = [];
  let total = [];
  let any = stats.loops - last_stats.loops;
  if (!any) {
    return;
  }
  last_time = now;
  let usage = process.cpuUsage();
  usage = (usage.user + usage.system)/(1000*1000); // CPU seconds
  stats.cpus = usage;
  function print(f, pre, div, label, prec) {
    let delta = stats[f] - last_stats[f];
    recent.push(`${pre}: ${(delta/dt/div).toFixed(prec)}${label}/s`);
    total.push(`${pre}: ${(stats[f]/full_dt/div).toFixed(prec)}${label}/s`);
    last_stats[f] = stats[f];
  }
  print('loops', 'L', 1, 'L', 2);
  print('send_bytes', 'S', 1024*1024, 'MB', 1);
  print('send_messages', 'S', 1000, 'K', 1);
  print('recv_bytes', 'R', 1024*1024, 'MB', 1);
  print('recv_messages', 'R', 1000, 'K', 1);
  let delta = stats.cpus - last_stats.cpus;
  recent.push(`CPU: ${(delta).toFixed(2)}s`);
  total.push(`CPU: ${(stats.cpus/stats.loops).toFixed(2)}s/L`);
  last_stats.cpus = stats.cpus;

  if (recent.length) {
    console.log('Recent ', recent.join('  '), '    Total: ', total.join('  '));
  }
}
setInterval(dostats, STATS_TIME);

exports.createTest = function createTest(send) {
  let idx = 0;
  let closed = false;
  function pump() {
    if (closed) {
      return;
    }
    if (idx === debug_data.length) {
      // closed = true;
      // console.log('All handled, closing...');
      // socket.close();
      return;
    }
    if (debug_data[idx][0] === 'R') {
      return;
    }
    // console.log(`Sent #${idx}`);
    let buf = debug_data[idx][1];
    ++idx;
    send(buf, function () {
      stats.send_bytes += buf.length;
      stats.send_messages++;
      if (idx === debug_data.length) {
        stats.loops++;
      }
      pump();
    });
  }

  return {
    onClose: function () {
      if (!closed) {
        // console.log('Other side closed');
      } else {
        // console.log('Closed');
      }
      closed = true;
    },
    onMessage: function (data) {
      if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
      }
      if (!(data instanceof Uint8Array)) {
        console.log('NON-BINARY MESSAGE RECEIVED', data);
      } else {
        assert(idx <= debug_data.length);
        assert(debug_data[idx][0] === 'R');
        assert(debug_data[idx][1].compare(data) === 0);
        stats.recv_bytes += data.length;
        stats.recv_messages++;
        // console.log(`Received #${idx}`);
        idx++;
        if (idx === debug_data.length) {
          stats.loops++;
        }
        pump();
      }
    },
    onError: function (err) {
      console.error('error', err);
    },
    start: pump,
  };
};
