// Contract addresses and ABIs
// These will be updated when contracts are deployed

export const CONTRACT_ADDRESSES = {
  // Abstract Testnet (Chain ID: 11124)
  ABSTRACT_TESTNET: {
    GAME_REGISTRY: "0x80e43a99873134e8C84FC9c40b90953484eCA191",
    YIELD_TOKEN: "0xDBCCaa7d61F77487C3f6A18CeDc1D14279Fbc3AA",
    ITEMS_1155: "0x29382082E4B3561F2A1fD62231043b43FBFf446C",
    PLAYER_STORE: "0x74aDD077d8Bf38AF45BB7192a946d4c1976b4463",
    RNG_HUB: "0x5761cbC6390166C721930fB4520e4f5e3Ff014ab",
    BANKER: "0x8cD7D22d555e3E66ce1ef09b61e631Ae9260B6d2",
    FARMING: "0xA6387E2c0790Fb9926E7CeA853DC5637287B1084",
    VENDOR: "0xC14dE77eFB0485b993f07e9690047a825Dc4c19d",
    SAGE: "0xC331933f500b7A8A5AB3d944fe7dF202E2a4205a",
    DEX: "0xAB4350ccf2493Bca1bceA7D77a4A172f51e8D76F",
    GARDENER: "0xBa8d710B23002C61dD860723F7AC02B80D4A0b01",
    FISHING: "0xE7f043be6Ad5F69900e00d012BD64B9aE7E08dAB",    
    CHEST_OPENER: "0x41b600E4fd11dfD8Df1916e5A4A26c55016f316C",
    LEADERBOARD: "0xdd3046AcaAE76A473124659148c735a65F099747",
    POTION: "0x66f2CAbb320cbC7deB15368AE0CcBAb8bEA55680",
    P2P_MARKET: "0xa9E790f573c1e574A3aF8CaBE36C8A298F9deED9",
    BOOST_NFT: "0xa1e760Ba6b777bE90D78ce6C44FEf61B7eb611f8",
    EQUIPMENT_REGISTRY: "0xDD8a1BF35451B5462c4861DF9F12Ad6dA358Af57",
    PRODUCE_SEEDER: "0xAc70CEa1c8AF01cAF87c2D9337B8FebeeF05F59B",
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
    "function setRngHub(address)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
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
    "function _requestRandomNumber() returns (uint256)",
    "function _onRandomNumberFulfilled(uint256 requestId, uint256 randomNumber)",
    "function fulfillRequest(uint256 requestId, uint256 randomNumber)",
    "function R() view returns (address)",
    "function ITEMS() view returns (address)",
    "function Y() view returns (address)",
    "function X_VAULT() view returns (address)",
    "function rarityPpm(uint256) view returns (uint32)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
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
    "function getUserCrops(address user) view returns ((uint256,uint64,uint16,uint16,bool)[])",
    "function crops(address, uint8) view returns ((uint256,uint64,uint16,uint16,bool))",
    "function count(address) view returns (uint8)",
    "function getGrowthTime(uint256 seedId) view returns (uint32)",
    "function previewHarvestForSeed(address user, uint256 seedId) view returns (uint256, uint256, uint256)",
    "function setSage(address sageAddr)",
    "function setEquipment(address eq)",
    "function setGrowthReductions(uint32 low, uint32 mid, uint32 high)",
    "function applyGrowthElixir(uint8 plotNumber)",
    "function applyPesticide(uint8 plotNumber)",
    "function applyFertilizer(uint8 plotNumber)",
    "function tCommon() view returns (uint32)",
    "function tUncommon() view returns (uint32)",
    "function tRare() view returns (uint32)",
    "function tEpic() view returns (uint32)",
    "function tLegendary() view returns (uint32)",
    "function growthReduceLow() view returns (uint32)",
    "function growthReduceMid() view returns (uint32)",
    "function growthReduceHigh() view returns (uint32)",
    "function R() view returns (address)",
    "function ITEMS() view returns (address)",
    "function GAME_TOKEN() view returns (address)",
    "function sage() view returns (address)",
    "function equipment() view returns (address)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
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
    "function R() view returns (address)",
    "function Y() view returns (address)",
    "function tokenBalance() view returns (uint256)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    "event FeeDeposited(address indexed depositor, uint256 amount)"
  ],

  SAGE: [
    "function lockGameToken(address user, uint256 amount)",
    "function unlockWeeklyWage()",
    "function unlockWeeklyHarvest()",
    "function lockedGameToken(address) view returns (uint256)",
    "function lastUnlockTime(address) view returns (uint64)",
    "function lastUnlockTimeHarvest(address) view returns (uint64)",
    "function getUnlockCost(uint16 level) pure returns (uint256)",
    "function R() view returns (address)",
    "function Y() view returns (address)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
  ],

  DEX: [
    "function depositNativeForGameToken() payable",
    "function depositGameTokenForNative(uint256 tokenAmount)",
    "function tokenPrice() view returns (uint256)",
    "function GAME_TOKEN() view returns (address)",
    "function tokenBalance() view returns (uint256)",
    "function balance() view returns (uint256)",
    "receive() external payable"
  ],

  PLAYER_STORE: [
    "function createProfile(string calldata name, bytes32 referralCode)",
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
    "function gameEpoch() view returns (uint64)",
    "function registerMyReferralCode(bytes32 myCode)",
    "function getMyReferralCode(address user) view returns (bytes32)",
    "function getSponsor(address user) view returns (address)",
    "function referralBpsByLevel(uint16) view returns (uint16)",
    "function setGameToken(address token)",
    "function setReferralBpsForLevel(uint16 level, uint16 bps)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    "function leaderboardHook() view returns (address)",
    "function Y() view returns (address)"
  ],

  ITEMS_1155: [
    "function balanceOf(address, uint256) view returns (uint256)",
    "function balanceOfBatch(address[], uint256[]) view returns (uint256[])",
    "function setApprovalForAll(address, bool)",
    "function isApprovedForAll(address, address) view returns (bool)",
    "function safeTransferFrom(address, address, uint256, uint256, bytes)",
    "function safeBatchTransferFrom(address, address, uint256[], uint256[], bytes)",
    "function mint(address to, uint256 id, uint256 amount)",
    "function burn(address from, uint256 id, uint256 amount)",
    "function supportsInterface(bytes4 interfaceId) view returns (bool)",
    "function uri(uint256) view returns (string)"
  ],

  YIELD_TOKEN: [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function transferFrom(address, address, uint256) returns (bool)",
    "function approve(address, uint256) returns (bool)",
    "function allowance(address, address) view returns (uint256)",
    "function mint(address, uint256)",
    "function burn(address, uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)"
  ],

  RNG_HUB: [
    "function fulfillRequest(uint256 requestId, uint256 randomNumber)",
    "function requestRandomNumberWithTraceId(uint256 traceId) returns (uint256)",
    "function setNextRequestId(uint256 requestId)",
    "function nextRequestId() view returns (uint256)",
    "function requests(uint256) view returns (uint256 traceId, uint256 randomNumber, address callback, bool isFulfilled)"
  ],

  FISHING: [
    "function craftBait1(uint256 baitCount)",
    "function craftBait2(uint256[] memory itemIds, uint256[] memory amounts)",
    "function craftBait3(uint256[] memory itemIds, uint256[] memory amounts)",
    "function fish(uint256 baitId, uint16 amount) returns (uint256)",
    "function setVrngSystem(address vrngSystem)",
    "function randomNumberCallback(uint256 requestId, uint256 randomNumber)",
    "function _requestRandomNumber() returns (uint256)",
    "function _onRandomNumberFulfilled(uint256 requestId, uint256 randomNumber)",
    "function fulfillRequest(uint256 requestId, uint256 randomNumber)",
    "function R() view returns (address)",
    "function ITEMS() view returns (address)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    "function hasPendingRequests(address player) view returns (bool)",
    "function getAllPendingRequests(address player) view returns (uint256[] requestIds, uint256[] baitIds, uint16[] levels, uint256[] amounts)",
    "function getPendingRequest(address player) view returns (uint256 requestId, uint256 baitId, uint16 level, uint256 amount)",
    "event FishingStarted(address indexed player, uint256 requestId, uint256 baitId, uint16 amount)",
    "event FishingResults(address indexed player, uint256 requestId, uint256[] itemIds, uint256[] amounts, uint256 baitId, uint16 totalAmount)"
  ],

  GARDENER: [
    "function levelUp(uint16 targetLevel)",
    "function priceForLevel(uint16) view returns (uint256)",
    "function maxLevel() view returns (uint16)",
    "function setPrice(uint16 level, uint256 price)",
    "function setMaxLevel(uint16 m)",
    "function R() view returns (address)",
    "function Y() view returns (address)",
    "function YE() view returns (address)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
  ],

  CHEST_OPENER: [
    "function claimDailyChest()",
    "function openChest(uint256 chestId)",
    "function setVrngSystem(address vrngSystem)",
    "function randomNumberCallback(uint256 requestId, uint256 randomNumber)",
    "function _requestRandomNumber() returns (uint256)",
    "function _onRandomNumberFulfilled(uint256 requestId, uint256 randomNumber)",
    "function hasPendingRequests(address player) view returns (bool)",
    "function getAllPendingRequests(address player) view returns (uint256[] requestIds, uint256[] chestIds)",
    "function getPendingRequest(address player) view returns (uint256 requestId, uint256 chestId)",
    "function R() view returns (address)",
    "function ITEMS() view returns (address)",
    "function loot(uint256, uint256) view returns (uint256)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    "event ChestResults(address indexed player, uint256 requestId, uint256 chestType, uint256 rewardId)"
  ],

  POTION: [
    "function craftGrowthElixir()",
    "function craftGrowthElixirBatch(uint256 count)",
    "function craftPesticide()",
    "function craftPesticideBatch(uint256 count)",
    "function craftFertilizer()",
    "function craftFertilizerBatch(uint256 count)",
    "function R() view returns (address)",
    "function ITEMS() view returns (address)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
  ],

  P2P_MARKET: [
    "function list(uint256 id, uint256 amount, uint256 pricePer) returns (uint256 lid)",
    "function purchase(uint256 lid, uint256 amount)",
    "function cancel(uint256 lid)",
    "function send(uint256 id, address to, uint256 amount)",
    "function batchBuy(uint256 id, uint256 maxPricePer, uint256 totalBudget)",
    "function listings(uint256 lid) view returns (address seller, uint256 id, uint256 amount, uint256 pricePer, bool active)",
    "function nextId() view returns (uint256)",
    "function TRADING_FEE_PERCENT() view returns (uint256)",
    "function R() view returns (address)",
    "function GAME_TOKEN() view returns (address)",
    "function GAME_ITEMS() view returns (address)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    "event Listed(uint256 indexed lid, address indexed seller, uint256 id, uint256 amount, uint256 pricePer)",
    "event Purchased(uint256 indexed lid, address indexed buyer, uint256 amount)",
    "event Canceled(uint256 indexed lid)"
  ],

  LEADERBOARD: [
    "function maybeReward()",
    "function lastRewardTs() view returns (uint64)",
    "function R() view returns (address)",
    "function ITEMS() view returns (address)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
  ],

  PRODUCE_SEEDER: [
    "function seedAllProduce(uint256 amountEach)",
    "function ITEMS() view returns (address)",
    "function MODULE_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
  ],

  BOOST_NFT: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function balanceOf(address owner) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function nextId() view returns (uint256)",
    "function mintInitialCharacters(address to)",
    "function mint(address to, uint256 tokenId)",
    "function mintWithName(address to, uint32 boostPpm, string calldata name) returns (uint256)",
    "function tokenBoostPpm(uint256 tokenId) view returns (uint32)",
    "function characterOf(uint256 tokenId) view returns (string)",
    "function setBoost(uint256 tokenId, uint32 boostPpm)",
    "function setName(uint256 tokenId, string calldata name)",
    "function setBaseURI(string memory baseURI)",
    "function supportsInterface(bytes4 interfaceId) view returns (bool)",
    "function transferFrom(address from, address to, uint256 tokenId)",
    "function safeTransferFrom(address from, address to, uint256 tokenId)",
    "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
    "function approve(address to, uint256 tokenId)",
    "function setApprovalForAll(address operator, bool approved)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function MINTER_ROLE() view returns (bytes32)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
    "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
    "event Minted(address indexed to, uint256 indexed tokenId, uint32 boostPpm)",
    "event BaseURISet(string baseURI)",
    "event BoostUpdated(uint256 indexed tokenId, uint32 boostPpm)",
    "event NameUpdated(uint256 indexed tokenId, string name)",
    "event CharacterBoostSet(string indexed name, uint32 boostPpm)"
  ],

  EQUIPMENT_REGISTRY: [
    "function getTokenBoostPpm(address player) view returns (uint32 tokenBoostPpm)",
    "function getAvatars(address player) view returns (address[] nfts, uint256[] tokenIds)",
    "function setAvatar(uint8 slot, address nft, uint256 tokenId)",
    "function clearAvatar(uint8 slot)",
    "function setBoostNft(address nft)",
    "function randomMint() returns (address nft, uint256 tokenId)",
    "function MAX_TOKEN_CAP_PPM() view returns (uint32)",
    "function randomMintEnabled() view returns (bool)",
    "function boostNft() view returns (address)",
    "event AvatarEquipped(address indexed player, uint8 indexed slot, address indexed nft, uint256 tokenId)",
    "event AvatarUnequipped(address indexed player, uint8 indexed slot)",
    "event RandomMintEnabled(bool enabled)",
    "event BoostNftSet(address nft)"
  ]
};

// Seed pack tiers and prices (matching smart contract constants)
export const SEED_PACK_TIERS = {
  1: { name: "Feeble", price: "1000000000000000000", priceLabel: "1 HNY" }, // 1e18
  2: { name: "Pico", price: "20000000000000000000", priceLabel: "20 HNY" }, // 20e18
  3: { name: "Basic", price: "100000000000000000000", priceLabel: "100 HNY" }, // 100e18
  4: { name: "Premium", price: "250000000000000000000", priceLabel: "250 HNY" } // 250e18
};

// Sage unlock rate constants (matching smart contract)
export const SAGE_UNLOCK_RATES = {
  DEFAULT: 100,    // 1% (level < 10)
  LEVEL_10: 1000,  // 10% (level >= 10)
  LEVEL_15: 1500   // 15% (level >= 15)
};

// =================TIME GLITCH=================
// export const SAGE_UNLOCK_COOLDOWN = 7 * 24 * 60 * 60 * 1000;
export const SAGE_UNLOCK_COOLDOWN = 7 * 60 * 60 * 1000;