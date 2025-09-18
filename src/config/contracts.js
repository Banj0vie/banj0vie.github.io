// Contract addresses and ABIs
// These will be updated when contracts are deployed

export const CONTRACT_ADDRESSES = {
  // Abstract Testnet (Chain ID: 11124)
  ABSTRACT_TESTNET: {
    GAME_REGISTRY: "0x26CA4D0Fd43cd35A4bA7FcF4eF060693aCd1CF91",
    YIELD_TOKEN: "0xB662E078FdF362A504377Bc4C4F60017F9b5ef48",
    ITEMS_1155: "0xb544aeF440A9f5FD41aaad8fD99046375AB8c735",
    PLAYER_STORE: "0xf43646Fb1Ef0CAB22C1296B24d030dafeeD42F02",
    RNG_HUB: "0x8c479F74F3B58766E2d4ff73E7957Daf1144f14D",
    BANKER: "0x45210e63dD3fF638690fC8f69384F8873Ca9F8f3",
    FARMING: "0xfCBf096a96D6e3cdDC1E82044Ab065601CD51ead",
    VENDOR: "0x7925e24a5230eF313fD9a7ed30A2728Def287F09",
    SAGE: "0x78596D79A691E294dA2D0393E4e1BCaDb4F9278b",
    DEX: "0xCa8189D9dEc8035B0f219e99DE6b91f5Bc0e2178",
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
    "function rngHub() view returns (address)",
    "function setGameItems(address)",
    "function setGameToken(address)",
    "function setPlayerStore(address)",
    "function setXGameTokenVault(address)",
    "function setRngHub(address)"
  ],

  VENDOR: [
    "function buySeedPack(uint8 tier, uint256 count) returns (uint256)",
    "function packPrice(uint8) view returns (uint256)",
    "function feeBpsToVault() view returns (uint16)",
    "function hasPendingRequests(address player) view returns (bool)",
    "function getAllPendingRequests(address player) view returns (uint256[] requestIds, uint8[] tiers, uint256[] counts)",
    "function getPendingRequest(address player) view returns (uint256 requestId, uint8 tier, uint256 count)",
    "function setPackPrice(uint8 tier, uint256 price)",
    "function setFeeBpsToVault(uint16 bps)",
    "function setVrngSystem(address vrngSystem)",
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
    "function setSage(address sageAddr)",
    "function tCommon() view returns (uint32)",
    "function tUncommon() view returns (uint32)",
    "function tRare() view returns (uint32)",
    "function tEpic() view returns (uint32)",
    "function tLegendary() view returns (uint32)",
    "event Planted(address indexed user, uint256 indexed seedId, uint8 plotIndex, uint64 readyAt)",
    "event Harvested(address indexed user, uint8 plotIndex, uint256 productId, uint256 amount)"
  ],

  BANKER: [
    "function stake(uint256 amount) returns (uint256 shares)",
    "function unstake(uint256 shares) returns (uint256 amount)",
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function totalGameToken() view returns (uint256)",
    "function depositGameToken(uint256 amount)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "event FeeDeposited(address indexed depositor, uint256 amount)"
  ],

  SAGE: [
    "function lockGameToken(address user, uint256 amount)",
    "function unlockWeeklyWage()",
    "function unlockWeeklyHarvest()",
    "function lockedGameToken(address) view returns (uint256)",
    "function lastUnlockTime(address) view returns (uint64)",
    "function lastUnlockTimeHarvest(address) view returns (uint64)",
    "function getUnlockCost(uint16 level) pure returns (uint256)"
  ],

  DEX: [
    "function depositNativeForGameToken(uint256 amount)",
    "function RATE_PER_ETH() view returns (uint256)"
  ],

  PLAYER_STORE: [
    "function createProfile(string calldata name)",
    "function profileOf(address) view returns (bool exists, uint16 level, uint64 nextChestAt, uint64 nextFishAt)",
    "function xpOf(address) view returns (uint256)",
    "function addXp(address, uint256)",
    "function usernameOf(address) view returns (string)",
    "function top5(uint256) view returns (address)",
    "function top5Xp(uint256) view returns (uint256)",
    "function epochStart() view returns (uint64)",
    "function setLevel(address user, uint16 newLevel)",
    "function setChestTime(address user, uint64 whenTs)",
    "function setFishTime(address user, uint64 whenTs)",
    "function setLeaderboardHook(address hook)",
    "function getXpRequiredForLevel(uint16 level) pure returns (uint256)",
    "function getXpRequiredForNextLevel(address user) view returns (uint256)",
    "function getEpochTop5(uint64 epoch) view returns (address[5] memory top5Players, uint256[5] memory top5XpAmounts, uint64 epochNumber, uint64 timestamp)",
    "function getEpochTop5Player(uint64 epoch, uint256 position) view returns (address, uint256)",
    "function advanceEpochIfNeeded()",
    "function gameEpoch() view returns (uint64)"
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
  ],

  // LEADERBOARD: [
  //   "function maybeReward()",
  //   "function lastRewardTs() view returns (uint64)"
  // ],

  // CHEST_OPENER: [
  //   "function claimDailyChest()",
  //   "function openChest(uint256 chestId)",
  //   "function setVrngSystem(address vrngSystem)"
  // ],

  // FISHING: [
  //   "function craftBait1(uint256 produceId, uint256 amount)",
  //   "function craftBait2(uint256 produceId, uint256 amount)",
  //   "function craftBait3(uint256 produceId, uint256 amount)",
  //   "function fish(uint256 baitId)",
  //   "function setVrngSystem(address vrngSystem)"
  // ],

  // GARDENER: [
  //   "function levelUp(uint16 targetLevel)",
  //   "function priceForLevel(uint16) view returns (uint256)",
  //   "function maxLevel() view returns (uint16)",
  //   "function setPrice(uint16 level, uint256 price)",
  //   "function setMaxLevel(uint16 m)"
  // ],

  // P2P_MARKET: [
  //   "function list(uint256 id, uint256 amount, uint256 pricePer) returns (uint256 lid)",
  //   "function purchase(uint256 lid, uint256 amount)",
  //   "function cancel(uint256 lid)",
  //   "function listings(uint256) view returns (address seller, uint256 id, uint256 amount, uint256 pricePer, bool active)",
  //   "function nextId() view returns (uint256)",
  //   "event Listed(uint256 indexed lid, address indexed seller, uint256 id, uint256 amount, uint256 pricePer)",
  //   "event Purchased(uint256 indexed lid, address indexed buyer, uint256 amount)",
  //   "event Canceled(uint256 indexed lid)"
  // ],

  // POTION: [
  //   "function craftGrowthElixir(uint256 produceId, uint256 amount)",
  //   "function craftPesticide(uint256 produceId, uint256 amount)",
  //   "function craftFertilizer(uint256 produceId, uint256 amount)"
  // ]
};

// Seed pack tiers and prices (matching smart contract constants)
export const SEED_PACK_TIERS = {
  1: { name: "Feeble", price: "1000000000000000000", priceLabel: "1 RDY" }, // 1e18
  2: { name: "Pico", price: "20000000000000000000", priceLabel: "20 RDY" }, // 20e18
  3: { name: "Basic", price: "100000000000000000000", priceLabel: "100 RDY" }, // 100e18
  4: { name: "Premium", price: "250000000000000000000", priceLabel: "250 RDY" } // 250e18
};

// Sage unlock rate constants (matching smart contract)
export const SAGE_UNLOCK_RATES = {
  DEFAULT: 100,    // 1% (level < 10)
  LEVEL_10: 1000,  // 10% (level >= 10)
  LEVEL_15: 1500   // 15% (level >= 15)
};

// =================TIME GLITCH=================
// export const SAGE_UNLOCK_COOLDOWN = 7 * 24 * 60 * 60 * 1000;
export const SAGE_UNLOCK_COOLDOWN = 7 * 60 * 1000;

