Gamified DeFi Website

Welcome to the Gamified DeFi front‑end. This app provides an interactive game layer on top of DeFi mechanics: buy seed packs, farm produce, open chests, fish for loot, trade on the vendor and DEX, and more.

## Features
- Vendor: Buy seed packs, reveal results via RNG
- Inventory: Manage items, open chests with reveal dialog, use potions
- Fishing: Start fishing and reveal loot with result dialog
- Farming: Plant/grow/harvest crops with potions and boosts
- DEX/Market: Swap and trade game tokens and items

## Tech Stack
- React + Vite
- Ethers.js / viem
- Context-based state + custom hooks
- Foundry contracts integration

## Prerequisites
- Node.js 18+
- Yarn or npm
- RPC URL (e.g., Sepolia/Abstract Testnet)
- Deployed contract addresses (from `contract/script/Deploy.s.sol` or `DeployRNG.s.sol`)

## Setup
1) Install dependencies
```bash
npm install
# or
yarn
```

2) Configure contract addresses (preferred)
Update `src/config/contracts.js`:
```js
export const CONTRACT_ADDRESSES = {
  ABSTRACT_TESTNET: {
    GAME_REGISTRY: "0x...",
    YIELD_TOKEN: "0x...",
    ITEMS_1155: "0x...",
    PLAYER_STORE: "0x...",
    RNG_HUB: "0x...",
    BANKER: "0x...",
    FARMING: "0x...",
    VENDOR: "0x...",
    SAGE: "0x...",
    DEX: "0x...",
    GARDENER: "0x...",
    FISHING: "0x...",
    CHEST_OPENER: "0x...",
    LEADERBOARD: "0x...",
    POTION: "0x...",
    P2P_MARKET: "0x...",
    BOOST_NFT: "0x...",
    EQUIPMENT_REGISTRY: "0x...",
  }
};

export const NETWORK_CONFIG = {
  ABSTRACT_TESTNET: {
    chainId: "0x2B74", // 11124
    rpcUrls: ["https://api.testnet.abs.xyz"],
    blockExplorerUrls: ["https://sepolia.abscan.org"],
  }
};
```
Paste the addresses printed by your contract deployment summary.

Optional: .env overrides
Create `.env` in `website/` to override values at runtime (useful for quick testing):
```bash
VITE_RPC_URL=https://your-rpc
VITE_CHAIN_ID=11124
VITE_GAME_REGISTRY=0x...
VITE_YIELD_TOKEN=0x...
VITE_ITEMS_1155=0x...
VITE_PLAYER_STORE=0x...
VITE_RNG_HUB=0x...
VITE_BANKER=0x...
VITE_FARMING=0x...
VITE_VENDOR=0x...
VITE_SAGE=0x...
VITE_DEX=0x...
VITE_GARDENER=0x...
VITE_FISHING=0x...
VITE_CHEST_OPENER=0x...
VITE_LEADERBOARD=0x...
VITE_POTION=0x...
VITE_P2P_MARKET=0x...
VITE_BOOST_NFT=0x...
VITE_EQUIPMENT_REGISTRY=0x...
VITE_PRODUCE_SEEDER=0x...
```
Notes:
- The app first reads `src/config/contracts.js`. Any VITE_* present will override those values.
- Make sure wallet network matches `NETWORK_CONFIG` (chainId must be hex in wallets).

3) Start the app
```bash
npm run dev
# or
yarn dev
```

## Contract Integration
- Contracts are loaded from `src/hooks/useContracts.js` and configured via `src/config/contracts.js` and environment variables.
- RNG flows: seed pack, fishing, chest opening show dialogs on fulfillment.

## Scripts & Common Tasks
- Update contract addresses: edit `src/config/contracts.js` or `.env`
- Clear cache/rebuild: `rm -rf node_modules && npm install`

## Troubleshooting
- Buttons stuck on "Using...": ensure RNG hub is set and VRNG fulfillment runs
- No events received: verify RPC websockets or polling provider
- Wrong chain: check `VITE_CHAIN_ID` and wallet network

## Project Structure
```
website/
  src/
    containers/        # UI modules (Vendor, Inventory, Fishing, etc.)
    hooks/             # Contract hooks and RNG helpers
    config/            # Addresses/config
    components/        # Reusable UI
```

## Licensing
SPDX-License-Identifier: MIT