'use strict';

let idCounter = 1;

async function rpcCall(url, method, params = [], timeoutMs = 10000) {
  const id = idCounter++;
  const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    const latencyMs = Date.now() - start;
    const json = await res.json();
    return { latencyMs, result: json.result, error: json.error ?? null };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return { latencyMs, result: null, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

async function checkRpc(node, timeoutMs) {
  const url = node.rpc;
  const results = {};

  // latency + blockNumber
  const blockRes = await rpcCall(url, 'eth_blockNumber', [], timeoutMs);
  results.latencyMs = blockRes.latencyMs;
  results.blockNumber = blockRes.error
    ? null
    : parseInt(blockRes.result, 16);
  results.blockNumberError = blockRes.error;

  if (results.blockNumber === null) {
    // Node is unreachable; skip remaining calls
    return { ...results, syncing: null, peerCount: null, networkId: null, clientVersion: null };
  }

  const [syncRes, peerRes, netRes, versionRes] = await Promise.all([
    rpcCall(url, 'eth_syncing', [], timeoutMs),
    rpcCall(url, 'net_peerCount', [], timeoutMs),
    rpcCall(url, 'net_version', [], timeoutMs),
    rpcCall(url, 'web3_clientVersion', [], timeoutMs),
  ]);

  results.syncing = syncRes.error ? null : syncRes.result;
  results.peerCount = peerRes.error ? null : parseInt(peerRes.result, 16);
  results.networkId = netRes.error ? null : netRes.result;
  results.clientVersion = versionRes.error ? null : versionRes.result;

  return results;
}

module.exports = { checkRpc };
