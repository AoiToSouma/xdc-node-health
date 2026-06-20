'use strict';

const fs = require('fs');
const path = require('path');
const { checkRpc } = require('./src/rpcChecker');
const { checkWs } = require('./src/wsChecker');
const { printNodeResult, printSummary } = require('./src/reporter');

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { nodes, checkIntervalSeconds, wsSubscriptionTimeoutSeconds, rpcTimeoutMs } = config;
const wsTimeoutMs = (wsSubscriptionTimeoutSeconds ?? 15) * 1000;
const rpcTimeout = rpcTimeoutMs ?? 10000;
const runOnce = process.argv.includes('--once');

async function checkNode(node) {
  const [rpc, ws] = await Promise.all([
    checkRpc(node, rpcTimeout),
    checkWs(node, wsTimeoutMs),
  ]);
  return { node, rpc, ws };
}

async function runChecks() {
  const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`XDC Node Health Check  —  ${timestamp}`);
  console.log('═'.repeat(60));

  const results = await Promise.all(nodes.map(checkNode));

  for (const { node, rpc, ws } of results) {
    printNodeResult(node, rpc, ws, timestamp);
  }

  printSummary(results);
}

async function main() {
  await runChecks();

  if (!runOnce) {
    const intervalMs = (checkIntervalSeconds ?? 60) * 1000;
    console.log(`\nNext check in ${checkIntervalSeconds ?? 60}s  (Ctrl+C to stop)\n`);
    setInterval(async () => {
      await runChecks();
      console.log(`\nNext check in ${checkIntervalSeconds ?? 60}s  (Ctrl+C to stop)\n`);
    }, intervalMs);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
