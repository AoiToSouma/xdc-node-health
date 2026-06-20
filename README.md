# xdc-node-health

XDC ブロックチェーンの RPC ノード健全性確認ツールです。
HTTP RPC と WebSocket の両方をチェックし、複数ノードを一括監視できます。

## 確認できる項目

| 項目 | HTTP RPC | WebSocket |
|------|:--------:|:---------:|
| レスポンスレイテンシ | ✓ | ✓ |
| ブロック高 | ✓ | ✓ |
| 同期状態 (eth_syncing) | ✓ | — |
| ピア数 (net_peerCount) | ✓ | — |
| ネットワーク ID | ✓ | — |
| クライアントバージョン | ✓ | — |
| newHeads サブスクリプション | — | ✓ |

## 必要環境

- Node.js 18 以上

## インストール

```bash
git clone https://github.com/AoiToSouma/xdc-node-health.git
cd xdc-node-health
npm install
cp config.json.sample config.json
```

## 設定

`config.json` を編集して監視するノードを登録します。（`config.json` は `.gitignore` に含まれており、コミットされません）

```json
{
  "checkIntervalSeconds": 60,
  "wsSubscriptionTimeoutSeconds": 15,
  "rpcTimeoutMs": 10000,
  "nodes": [
    {
      "name": "My XDC Node",
      "rpc": "http://your-node:8545",
      "ws": "ws://your-node:8546"
    },
    {
      "name": "RPC only node",
      "rpc": "https://your-rpc-endpoint"
    }
  ]
}
```

| キー | 説明 | デフォルト |
|------|------|-----------|
| `checkIntervalSeconds` | 定期実行の間隔（秒） | `60` |
| `wsSubscriptionTimeoutSeconds` | WS newHeads 待機タイムアウト（秒） | `15` |
| `rpcTimeoutMs` | HTTP RPC タイムアウト（ミリ秒） | `10000` |
| `nodes[].name` | ノードの表示名 | — |
| `nodes[].rpc` | HTTP RPC エンドポイント | — |
| `nodes[].ws` | WebSocket エンドポイント（省略可） | — |

## 使い方

### 1回だけ実行

```bash
node index.js --once
```

### 定期実行（`checkIntervalSeconds` 間隔でループ）

```bash
node index.js
```

## 出力例

```
════════════════════════════════════════════════════════════
XDC Node Health Check  —  2026/6/20 18:00:00
════════════════════════════════════════════════════════════

▶ My XDC Node

  [HTTP RPC]  http://your-node:8545
  Status      : OK
  Latency     : 42ms
  Block #     : 12,345,678
  Syncing     : synced
  Peers       : 25
  Network ID  : 50
  Client      : XDC/v1.4.0-stable/linux-amd64/go1.21.0

  [WebSocket]  ws://your-node:8546
  Status      : CONNECTED
  Latency     : 18ms
  Block #     : 12,345,678
  newHeads    : OK – received newHeads event

────────────────────────────────────────────────────────────
Summary  RPC: 1/1 OK   WS: 1/1 OK
────────────────────────────────────────────────────────────
```

レイテンシは応答速度に応じて色分けされます。

- 緑 (< 300ms)
- 黄 (300ms – 1000ms)
- 赤 (> 1000ms)
