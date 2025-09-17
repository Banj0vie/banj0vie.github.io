// Contract addresses and ABIs
// These will be updated when contracts are deployed

export const CONTRACT_ADDRESSES = {
  // Abstract Testnet (Chain ID: 11124)
  ABSTRACT_TESTNET: {
    GAME_REGISTRY: "0x141B6E1a88C0C3AAd6EC4d9df9c5438AdD092265",
    YIELD_TOKEN: "0x79107afc310e9c712E63764Ee82BD3D1cd412784",
    ITEMS_1155: "0xe8aD7B318C0CcAA72aa34De6A03BfBef451b1ec4",
    PLAYER_STORE: "0xCF25Eb2A7c36cf6F196d13e4250c05AC2694bC9A",
    RNG_HUB: "0xa47E0e674AD31280411d3f44969D98C76be283b8",
    BANKER: "0x8Dbe88538728bEF02a829f9fcED8F3314f88B09E",
    FARMING: "0x5822aC3e36F94227DAe366D6AB30FB5723041E66",
    VENDOR: "0x48b2555A93E702F481f6318B5Edf308CC4E0e0e0",
    SAGE: "0xc3Aa094e95e536303b5904094d70107B25f32f1e",
    DEX: "0xDAD313AC6cFbD2632Ed4C795f460eb36Bfed261E",
  }
};

export const NETWORK_CONFIG = {
  ABSTRACT_TESTNET: {
    chainId: "0x2B74", // 11124 in hex (MetaMask needs hex format)
    chainName: "Abstract Testnet",
    rpcUrls: [
      "https://api.testnet.abs.xyz"
    ],
    blockExplorerUrls: ["https://sepolia.abscan.org"],
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  }
};

// Contract ABIs (simplified versions for key functions)
export const CONTRACT_ABIS = {
  GAME_REGISTRY: [
    "function gameItems() view returns (address)",
    "function gameToken() view returns (address)",
    "function playerStore() view returns (address)",
    "function xGameTokenVault() view returns (address)",
    "function rngHub() view returns (address)"
  ],
  
  VENDOR: [
    "function buySeedPack(uint8 tier, uint256 count) returns (uint256)",
    "function packPrice(uint8) view returns (uint256)",
    "function feeBpsToVault() view returns (uint16)",
    "function hasPendingRequests(address player) view returns (bool)",
    "function getAllPendingRequests(address player) view returns (uint256[] requestIds, uint8[] tiers, uint256[] counts)",
    "function getPendingRequest(address player) view returns (uint256 requestId, uint8 tier, uint256 count)",
    "function randomNumberCallback(uint256 requestId, uint256 randomNumber)",
    "event SeedPack(address indexed player, uint8 tier, uint256 requestId)",
    "event SeedsRevealed(address indexed player, uint256 requestId, uint256[] seedIds, uint8 tier, uint256 count)"
  ],
  
  FARMING: [
    "function plant(uint256 seedId, uint8 plotNumber)",
    "function plantBatch(uint256[] calldata seedIds, uint8[] calldata plotNumbers)",
    "function harvest(uint8 slot)",
    "function harvestAll()",
    "function harvestMany(uint8[] calldata slots)",
    "function getMaxPlots(address user) view returns (uint8)",
    "function getUserCrops(address user) view returns (tuple(uint256 seedId, uint64 endTime)[])",
    "function crops(address, uint8) view returns (uint256 seedId, uint64 endTime)",
    "function count(address) view returns (uint8)",
    "function getGrowthTime(uint256 seedId) view returns (uint32)",
    "event Planted(address indexed user, uint256 indexed seedId, uint8 plotIndex, uint64 readyAt)",
    "event Harvested(address indexed user, uint8 plotIndex, uint256 productId, uint256 amount)"
  ],
  
  BANKER: [
    "function stake(uint256 amount) returns (uint256 shares)",
    "function unstake(uint256 shares) returns (uint256 amount)",
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function totalGameToken() view returns (uint256)",
    "function depositGameToken(uint256 amount)"
  ],
  
  SAGE: [
    "function lockGameToken(address user, uint256 amount)",
    "function unlockGameToken()",
    "function lockedGameToken(address) view returns (uint256)",
    "function lastUnlockTime(address) view returns (uint64)"
  ],
  
  DEX: [
    "function depositNativeForGameToken(uint256 amount)",
    "function RATE_PER_ETH() view returns (uint256)"
  ],
  
  PLAYER_STORE: [
    "function createProfile(string calldata name)",
    "function profileOf(address) view returns (bool exists, uint16 level, uint64 nextChestAt, uint64 nextFishAt)",
    "function xpOf(address) view returns (uint256)",
    "function addXP(address, uint256)",
    "function usernameOf(address) view returns (string)",
    "function top5(uint256) view returns (address)",
    "function top5Xp(uint256) view returns (uint256)",
    "function epochStart() view returns (uint64)"
  ],
  
  ITEMS_1155: [
    "function balanceOf(address, uint256) view returns (uint256)",
    "function balanceOfBatch(address[], uint256[]) view returns (uint256[])",
    "function setApprovalForAll(address, bool)",
    "function isApprovedForAll(address, address) view returns (bool)",
    "function safeTransferFrom(address, address, uint256, uint256, bytes)",
    "function safeBatchTransferFrom(address, address, uint256[], uint256[], bytes)"
  ],
  
  YIELD_TOKEN: [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function transferFrom(address, address, uint256) returns (bool)",
    "function approve(address, uint256) returns (bool)",
    "function allowance(address, address) view returns (uint256)",
    "function mint(address, uint256)",
    "function burn(address, uint256)"
  ],
  
  RNG_HUB: [
    "function fulfillRequest(uint256 requestId, uint256 randomNumber)"
  ]
};

// Seed pack tiers and prices (matching smart contract constants)
export const SEED_PACK_TIERS = {
  1: { name: "Feeble", price: "1000000000000000000", priceLabel: "1 RDY" }, // 1e18
  2: { name: "Pico", price: "20000000000000000000", priceLabel: "20 RDY" }, // 20e18
  3: { name: "Basic", price: "100000000000000000000", priceLabel: "100 RDY" }, // 100e18
  4: { name: "Premium", price: "250000000000000000000", priceLabel: "250 RDY" } // 250e18
};

// Growth times in seconds (matching smart contract)
// export const GROWTH_TIMES = {
//   COMMON: 3 * 60 * 60, // 3 hours
//   UNCOMMON: 4 * 60 * 60, // 4 hours
//   RARE: 8 * 60 * 60, // 8 hours
//   EPIC: 12 * 60 * 60, // 12 hours
//   LEGENDARY: 24 * 60 * 60 // 24 hours
// };
export const GROWTH_TIMES = {
  COMMON: 30,
  UNCOMMON: 40,
  RARE: 80,
  EPIC: 120,
  LEGENDARY: 240
};

