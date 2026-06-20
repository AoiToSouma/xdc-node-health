'use strict';

const WebSocket = require('ws');

let wsIdCounter = 1;

function checkWs(node, timeoutMs) {
  return new Promise((resolve) => {
    if (!node.ws) {
      return resolve({ connected: false, latencyMs: null, blockNumber: null, subscription: null, error: 'No WS URL configured' });
    }

    const result = {
      connected: false,
      latencyMs: null,
      blockNumber: null,
      subscription: null,
      error: null,
    };

    let ws;
    let connectTimer;
    let subscribeTimer;
    let settled = false;

    function finish() {
      if (settled) return;
      settled = true;
      clearTimeout(connectTimer);
      clearTimeout(subscribeTimer);
      try { ws?.terminate(); } catch (_) {}
      resolve(result);
    }

    const connectStart = Date.now();

    try {
      ws = new WebSocket(node.ws, { handshakeTimeout: timeoutMs });
    } catch (err) {
      result.error = err.message;
      return resolve(result);
    }

    connectTimer = setTimeout(() => {
      result.error = 'Connection timeout';
      finish();
    }, timeoutMs);

    ws.on('error', (err) => {
      result.error = err.message;
      finish();
    });

    ws.on('open', () => {
      result.connected = true;
      result.latencyMs = Date.now() - connectStart;
      clearTimeout(connectTimer);

      // eth_blockNumber over WS to verify RPC works
      const rpcId = wsIdCounter++;
      ws.send(JSON.stringify({ jsonrpc: '2.0', id: rpcId, method: 'eth_blockNumber', params: [] }));

      // Also subscribe to newHeads
      const subId = wsIdCounter++;
      ws.send(JSON.stringify({ jsonrpc: '2.0', id: subId, method: 'eth_subscribe', params: ['newHeads'] }));

      let subscriptionId = null;
      let gotBlock = false;

      subscribeTimer = setTimeout(() => {
        if (!gotBlock) result.subscription = 'timeout – no new block received';
        finish();
      }, timeoutMs);

      ws.on('message', (data) => {
        let msg;
        try { msg = JSON.parse(data); } catch (_) { return; }

        // Response to eth_blockNumber
        if (msg.id === rpcId && msg.result) {
          result.blockNumber = parseInt(msg.result, 16);
        }

        // Response to eth_subscribe (returns subscription id)
        if (msg.id === subId && msg.result) {
          subscriptionId = msg.result;
        }

        // Subscription notification
        if (msg.method === 'eth_subscription' && msg.params?.subscription === subscriptionId) {
          gotBlock = true;
          result.subscription = 'OK – received newHeads event';
          finish();
        }
      });
    });
  });
}

module.exports = { checkWs };
