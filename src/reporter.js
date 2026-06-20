'use strict';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

function ok(s) { return `${GREEN}${s}${RESET}`; }
function err(s) { return `${RED}${s}${RESET}`; }
function warn(s) { return `${YELLOW}${s}${RESET}`; }
function dim(s) { return `${DIM}${s}${RESET}`; }
function header(s) { return `${BOLD}${CYAN}${s}${RESET}`; }

function formatLatency(ms) {
  if (ms === null) return err('N/A');
  if (ms < 300) return ok(`${ms}ms`);
  if (ms < 1000) return warn(`${ms}ms`);
  return err(`${ms}ms`);
}

function formatSyncing(syncing) {
  if (syncing === null) return err('unknown');
  if (syncing === false) return ok('synced');
  const { currentBlock, highestBlock } = syncing;
  const cur = parseInt(currentBlock, 16);
  const high = parseInt(highestBlock, 16);
  return warn(`syncing ${cur.toLocaleString()} / ${high.toLocaleString()}`);
}

function printNodeResult(node, rpc, ws, timestamp) {
  console.log(`\n${header(`▶ ${node.name}`)}`);
  console.log(dim(`  ${timestamp}`));

  console.log(`\n  ${BOLD}[HTTP RPC]${RESET}  ${dim(node.rpc)}`);
  if (rpc.blockNumberError && rpc.blockNumber === null) {
    console.log(`  Status      : ${err('UNREACHABLE')}  (${rpc.blockNumberError})`);
  } else {
    console.log(`  Status      : ${ok('OK')}`);
    console.log(`  Latency     : ${formatLatency(rpc.latencyMs)}`);
    console.log(`  Block #     : ${ok(rpc.blockNumber?.toLocaleString() ?? 'N/A')}`);
    console.log(`  Syncing     : ${formatSyncing(rpc.syncing)}`);
    console.log(`  Peers       : ${rpc.peerCount !== null ? ok(rpc.peerCount) : err('N/A')}`);
    console.log(`  Network ID  : ${rpc.networkId ?? err('N/A')}`);
    console.log(`  Client      : ${rpc.clientVersion ?? err('N/A')}`);
  }

  console.log(`\n  ${BOLD}[WebSocket]${RESET}  ${dim(node.ws ?? 'not configured')}`);
  if (!ws.connected) {
    console.log(`  Status      : ${err('UNREACHABLE')}  (${ws.error ?? 'failed to connect'})`);
  } else {
    console.log(`  Status      : ${ok('CONNECTED')}`);
    console.log(`  Latency     : ${formatLatency(ws.latencyMs)}`);
    console.log(`  Block #     : ${ws.blockNumber !== null ? ok(ws.blockNumber.toLocaleString()) : err('N/A')}`);
    console.log(`  newHeads    : ${ws.subscription ? (ws.subscription.startsWith('OK') ? ok(ws.subscription) : warn(ws.subscription)) : err('N/A')}`);
  }
}

function printSummary(results) {
  const total = results.length;
  const rpcOk = results.filter(r => r.rpc.blockNumber !== null).length;
  const wsOk = results.filter(r => r.ws.connected).length;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${BOLD}Summary${RESET}  RPC: ${rpcOk}/${total} OK   WS: ${wsOk}/${total} OK`);
  console.log('─'.repeat(60));
}

module.exports = { printNodeResult, printSummary };
