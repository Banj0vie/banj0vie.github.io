import { ComputeBudgetProgram, PublicKey } from '@solana/web3.js';
import { GAME_TOKEN_MINT, SOLANA_VALLEY_PROGRAM_ID } from '../constants/programId';
import { SEEDS } from '../constants/seeds';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { CAT_BASIC_PRODUCE, CAT_CHEST, CAT_PICO_PRODUCE, CAT_PREMIUM_PRODUCE, ID_BAIT_ITEMS, ID_CHEST_ITEMS, ID_POTION_ITEMS, ID_PRODUCE_ITEMS, ID_SEEDS } from '../../constants/app_ids';
import { chestLootTable } from '../../utils/basic';
import { BN } from 'bn.js';

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');


export const getGameRegistryInfo = async (program) => {
  try {
    const gameRegistryPda = getGameRegistryPDA();
    const gameRegistry = await program.account.gameRegistry.fetch(gameRegistryPda);
    return gameRegistry;
  } catch (error) {
    console.error('Error getting game registry info:', error);
    throw error;
  }
};

export const getSponsorGameAta = async (program, publicKey) => {
  try {
    const userData = await program.account.userData.fetch(getUserDataPDA(publicKey));
    const sponsor = userData.sponsor;
    if (sponsor && !sponsor.equals(PublicKey.default)) {
      return getAssociatedTokenAddressSync(GAME_TOKEN_MINT, sponsor, false);
    }
    // If no sponsor or sponsor is default, use the user's own ATA as fallback
    return getAssociatedTokenAddressSync(GAME_TOKEN_MINT, publicKey, false);
  } catch (error) {
    // If we can't get user data, use the user's own ATA as fallback
    return getAssociatedTokenAddressSync(GAME_TOKEN_MINT, publicKey, false);
  }
};

export const preIx = [
  ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 }),
  ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
];

export const getSeedIdsForTierFromAppIds = (tier) => {
  const categoryByTier = { 1: 1, 2: 2, 3: 3, 4: 4 };
  const category = categoryByTier[tier];
  if (!category) throw new Error('Unsupported tier');
  const ids = [];
  for (const key of Object.keys(ID_SEEDS)) {
    const id = ID_SEEDS[key];
    if (typeof id === 'number' && (id >> 8) === category) ids.push(id);
  }
  return ids;
};

export const getRevealSeedsRemainingAccounts = async (publicKey, tier) => {
  // Include all possible item mints for this tier, not just those in ID_SEEDS
  // Based on contract's pick_sft_id: tier 1-4 can reveal subtypes 1-11 max
  // Tier maps to category: 1->1, 2->2, 3->3, 4->4
  const categoryByTier = { 1: 1, 2: 2, 3: 3, 4: 4 };
  const category = categoryByTier[tier];
  if (!category) throw new Error('Unsupported tier');
  
  // Maximum possible subtypes per tier based on contract's seed arrays:
  // FEEBLE_SEED: [1,1,1,1,1] = max subtype 5
  // PICO_SEED: [1,1,1,1,1] = max subtype 5
  // BASIC_SEED: [4,3,2,2,1] = max subtype 12 (4+3+2+2+1)
  // PRIMIUM_SEED: [3,3,2,2,1] = max subtype 11 (3+3+2+2+1)
  const maxSubtypesByTier = { 1: 5, 2: 5, 3: 12, 4: 11 };
  const maxSubtype = maxSubtypesByTier[tier] || 11;
  
  const seen = new Set();
  const accounts = [];
  
  // Include all possible item mints for this tier (category + all possible subtypes)
  for (let subtype = 1; subtype <= maxSubtype; subtype++) {
    const itemId = category * 256 + subtype;
    const mint = getItemMintPDA(itemId);
    const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
    const m = mint.toBase58();
    const a = ata.toBase58();
    if (!seen.has(m)) { accounts.push({ pubkey: mint, isWritable: true, isSigner: false }); seen.add(m); }
    if (!seen.has(a)) { accounts.push({ pubkey: ata, isWritable: true, isSigner: false }); seen.add(a); }
  }
  
  const itemMintAuth = getItemMintAuthPDA();
  const ak = itemMintAuth.toBase58();
  if (!seen.has(ak)) accounts.push({ pubkey: itemMintAuth, isWritable: false, isSigner: false });
  return accounts;
};

/** Remaining accounts for prod_mint (category 0=Pico, 1=Basic, 2=Premium).
 *  For Basic (category 1), batch splits items: batch 0 = first 6, batch 1 = last 6 (avoids MaxInstructionTraceLengthExceeded). */
export const getProdMintRemainingAccounts = (publicKey, category, batch = 0) => {
  const catByIndex = { 0: CAT_PICO_PRODUCE, 1: CAT_BASIC_PRODUCE, 2: CAT_PREMIUM_PRODUCE };
  const cat = catByIndex[category];
  if (cat === undefined) return [];
  let itemIds = Object.values(ID_PRODUCE_ITEMS).filter((id) => (id >> 8) === cat);
  if (category === 1) {
    const start = batch === 0 ? 0 : 6;
    const end = batch === 0 ? 6 : 12;
    itemIds = itemIds.slice(start, end);
  }
  const accounts = [];
  for (const itemId of itemIds) {
    const mint = getItemMintPDA(itemId);
    const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
    accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
    accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
  }
  const itemMintAuth = getItemMintAuthPDA();
  accounts.push({ pubkey: itemMintAuth, isWritable: false, isSigner: false });
  return accounts;
};

export const getPlantBatchRemainingAccounts = (seedIds, publicKey) => {
  const accounts = [];
  for (const seedId of seedIds) {
    const id = seedId & 0xFF;
    const category = (seedId >> 16) & 0xFF;
    const itemId = category * 256 + id;
    const mint = getItemMintPDA(itemId);
    const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
    accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
    accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
  }
  return accounts;
};

export const getHarvestRemainingAccounts = async (slots, publicKey, program) => {
  const accounts = [];
  const userDataPda = getUserDataPDA(publicKey);
  const userData = await program.account.userData.fetch(userDataPda);
  for (const slot of slots) {
    const crop = userData.userCrops[Number(slot)];
    const category = (crop.id >> 16) & 0xFF;
    if (category < 2 || category > 4) continue;
    const id = crop.id & 0xFF;
    const itemId = (category + 3) * 256 + id;
    const mint = getItemMintPDA(itemId);
    const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
    accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
    accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
  }
  const itemMintAuth = getItemMintAuthPDA();
  accounts.push({ pubkey: itemMintAuth, isWritable: false, isSigner: false });
  return accounts;
};

export const getChestRemainingAccounts = (publicKey) => {
  const chestItems = Object.values(ID_CHEST_ITEMS);
  const accounts = [];
  for (const itemId of chestItems) {
    const mint = getItemMintPDA(itemId);
    const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
    accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
    accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
  }
  const itemMintAuth = getItemMintAuthPDA();
  accounts.push({ pubkey: itemMintAuth, isWritable: false, isSigner: false });
  return accounts;
};

export const getChestOpenRemainingAccounts = (chestType, publicKey) => {
  const chestItems = chestLootTable(chestType);
  const accounts = [];
  for (const itemId of chestItems) {
    const mint = getItemMintPDA(itemId);
    const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
    accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
    accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
  }
  const chestMint = getItemMintPDA((CAT_CHEST << 8) | Number(chestType));
  accounts.push({ pubkey: chestMint, isWritable: true, isSigner: false });
  const chestAta = getAssociatedTokenAddressSync(chestMint, publicKey, false);
  accounts.push({ pubkey: chestAta, isWritable: true, isSigner: false });
  const itemMintAuth = getItemMintAuthPDA();
  accounts.push({ pubkey: itemMintAuth, isWritable: false, isSigner: false });
  return accounts;
};

export const getUserDataPDA = (wallet) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.USER_DATA), wallet.toBuffer()],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const getReceiverPDA = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.RECEIVER)],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const getBankerDataPDA = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.BANKER_DATA)],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const getBankVaultPDA = (bankerDataPda) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.BANK_VAULT), bankerDataPda.toBuffer()],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const getBankVaultAta = (bankerDataPda) => {
  const bankVaultPda = getBankVaultPDA(bankerDataPda);
  return getAssociatedTokenAddressSync(GAME_TOKEN_MINT, bankVaultPda, true);
};

export const getGameVaultPDA = () => {
  const gameRegistryPda = getGameRegistryPDA();
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.GAME_VAULT), gameRegistryPda.toBuffer()],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const getGameVaultAta = () => {
  const gameVaultPda = getGameVaultPDA();
  return getAssociatedTokenAddressSync(GAME_TOKEN_MINT, gameVaultPda, true);
};

export const getGameRegistryPDA = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.GAME_REGISTRY)],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const getEpochTop5PDA = (epoch) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.EPOCH_TOP5), new BN(epoch).toArrayLike(Buffer, 'le', 4)],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const getRequestPDA = (wallet, nonce) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.REQUEST), wallet.toBuffer(), nonce.toArrayLike(Buffer, 'le', 8)],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const getFishingRequestPDA = (wallet, nonce) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.FISHING_REQUEST), wallet.toBuffer(), nonce.toArrayLike(Buffer, 'le', 8)],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const getListingPDA = (listingId) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.LISTING), listingId.toArrayLike(Buffer, 'le', 8)],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const getMarketDataPDA = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.MARKET_DATA)],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const getReferralCodeOwnerPDA = (code) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.REF_CODE), code],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
};

export const splitItem = (itemId) => {
  return [Math.floor(itemId / 256), itemId % 256];
};

export const getItemId = (category, subtype) => {
  return category * 256 + subtype;
};

export const getItemMintPDA = (itemId) => {
  const [category, subtype] = splitItem(itemId);
  const configPublicKey = getGameRegistryPDA();
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.ITEM_MINT),
      configPublicKey.toBuffer(),
      new Uint8Array([category]),
      new Uint8Array([subtype]),
    ],
    SOLANA_VALLEY_PROGRAM_ID,
  )[0];
};

export const getItemMintAuthPDA = () => {
  const gameRegistryPda = getGameRegistryPDA();
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.ITEM_MINT_AUTH), gameRegistryPda.toBuffer()],
    SOLANA_VALLEY_PROGRAM_ID,
  )[0];
};

export const getGameTokenMintAuthPDA = (gameRegistryKey) => {
  if (!gameRegistryKey) {
    gameRegistryKey = getGameRegistryPDA();
  }
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.GAME_TOKEN_MINT_AUTH), gameRegistryKey.toBuffer()],
    SOLANA_VALLEY_PROGRAM_ID,
  )[0];
};

export const getMetadataPDA = (mintPda) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintPda.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
};

export const getUserPDAs = (wallet) => {
  return {
    userData: getUserDataPDA(wallet),
    bankerData: getBankerDataPDA(wallet),
  };
};

export const getMarketPDAs = () => {
  return {
    marketData: getMarketDataPDA(),
    gameRegistry: getGameRegistryPDA(),
  };
};

export const getRequestPDAs = (wallet, nonce) => {
  return {
    vendorRequest: getRequestPDA(wallet, nonce),
    fishingRequest: getFishingRequestPDA(wallet, nonce),
  };
};

export const getCraftBaitRemainingAccounts = (publicKey) => {
  const accounts = [];
  
  // Add all produce items (for burning ingredients)
  const produceItems = Object.values(ID_PRODUCE_ITEMS);
  for (const itemId of produceItems) {
    const mint = getItemMintPDA(itemId);
    const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
    accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
    accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
  }
  
  // Add all bait items (for minting crafted bait)
  const baitItems = Object.values(ID_BAIT_ITEMS);
  for (const itemId of baitItems) {
    const mint = getItemMintPDA(itemId);
    const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
    accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
    accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
  }
  
  // Add item mint authority
  const itemMintAuth = getItemMintAuthPDA();
  accounts.push({ pubkey: itemMintAuth, isWritable: false, isSigner: false });
  
  return accounts;
};

export const getCraftBait1RemainingAccounts = (publicKey) => {
  const accounts = [];
  
  try {
    // Bait 1 requires: POTATO, LETTUCE, CABBAGE (for burning) and BAIT_1 (for minting)
    const requiredItems = [
      ID_PRODUCE_ITEMS.POTATO,
      ID_PRODUCE_ITEMS.LETTUCE, 
      ID_PRODUCE_ITEMS.CABBAGE,
      ID_BAIT_ITEMS.BAIT_1
    ];
    
    for (const itemId of requiredItems) {
      const mint = getItemMintPDA(itemId);
      const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
      accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
      accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
    }
    
    // Add item mint authority
    const itemMintAuth = getItemMintAuthPDA();
    accounts.push({ pubkey: itemMintAuth, isWritable: false, isSigner: false });
    return accounts;
  } catch (error) {
    console.error('getCraftBait1RemainingAccounts - error:', error);
    throw error;
  }
};

export const getPotionUsageRemainingAccounts = (publicKey, potionId) => {
  const accounts = [];
  
  try {
    // Add the specific potion item mint and ATA for burning
    const mint = getItemMintPDA(potionId);
    const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
    accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
    accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
    
    // Add item mint authority
    const itemMintAuth = getItemMintAuthPDA();
    accounts.push({ pubkey: itemMintAuth, isWritable: false, isSigner: false });
    return accounts;
  } catch (error) {
    console.error('getPotionUsageRemainingAccounts - error:', error);
    throw error;
  }
};

export const getRevealFishingRemainingAccounts = (publicKey) => {
  const accounts = [];
  
  try {
    // Reveal fishing can mint these reward items (matching Rust constants):
    const rewardItems = [
      ID_POTION_ITEMS.POTION_FERTILIZER,      // CAT_POTION << 8 | 3
      ID_POTION_ITEMS.POTION_PESTICIDE,       // CAT_POTION << 8 | 2  
      ID_POTION_ITEMS.POTION_GROWTH_ELIXIR,   // CAT_POTION << 8 | 1
      ID_CHEST_ITEMS.CHEST_GOLD,              // CAT_CHEST << 8 | 4
      ID_CHEST_ITEMS.CHEST_SILVER,            // CAT_CHEST << 8 | 3
      ID_CHEST_ITEMS.CHEST_BRONZE,            // CAT_CHEST << 8 | 2
      ID_CHEST_ITEMS.CHEST_WOOD               // CAT_CHEST << 8 | 1
    ];
    
    for (const itemId of rewardItems) {
      const mint = getItemMintPDA(itemId);
      const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
      accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
      accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
    }
    
    // Add item mint authority
    const itemMintAuth = getItemMintAuthPDA();
    accounts.push({ pubkey: itemMintAuth, isWritable: false, isSigner: false });
    return accounts;
  } catch (error) {
    console.error('getRevealFishingRemainingAccounts - error:', error);
    throw error;
  }
};

export const getCraftBaitSpecificRemainingAccounts = (publicKey, itemIds, baitId) => {
  const accounts = [];
  
  try {
    // Ensure itemIds is an array
    const itemIdsArray = Array.isArray(itemIds) ? itemIds : [];
    
    // Add specific produce items that are being used (for burning ingredients)
    for (const itemId of itemIdsArray) {
      const mint = getItemMintPDA(itemId);
      const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
      accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
      accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
    }
    
    // Add the specific bait item being crafted (for minting)
    const baitMint = getItemMintPDA(baitId);
    const baitAta = getAssociatedTokenAddressSync(baitMint, publicKey, false);
    accounts.push({ pubkey: baitMint, isWritable: true, isSigner: false });
    accounts.push({ pubkey: baitAta, isWritable: true, isSigner: false });
    
    // Add item mint authority
    const itemMintAuth = getItemMintAuthPDA();
    accounts.push({ pubkey: itemMintAuth, isWritable: false, isSigner: false });
    
    return accounts;
  } catch (error) {
    console.error('getCraftBaitSpecificRemainingAccounts - error:', error);
    throw error;
  }
};

export const getCraftPotionRemainingAccounts = (publicKey, potionType) => {
  const accounts = [];
  
  try {
    // Validate inputs
    if (!publicKey) {
      console.warn('getCraftPotionRemainingAccounts: publicKey is null/undefined');
      return [];
    }
    
    if (!potionType) {
      console.warn('getCraftPotionRemainingAccounts: potionType is null/undefined');
      return [];
    }
    
    let requiredItems = [];
    
    // Define required items for each potion type based on Rust program
    switch (potionType) {
      case 'growth_elixir':
        requiredItems = [
          ID_PRODUCE_ITEMS.RADISH,    // 2x required
          ID_PRODUCE_ITEMS.ONION,     // 8x required
          ID_POTION_ITEMS.POTION_GROWTH_ELIXIR  // output
        ];
        break;
      case 'pesticide':
        requiredItems = [
          ID_PRODUCE_ITEMS.GRAPES,    // 2x required
          ID_PRODUCE_ITEMS.BERRY,    // 3x required
          ID_PRODUCE_ITEMS.CAULIFLOWER, // 3x required
          ID_POTION_ITEMS.POTION_PESTICIDE  // output
        ];
        break;
      case 'fertilizer':
        requiredItems = [
          ID_PRODUCE_ITEMS.DRAGONFRUIT, // 2x required
          ID_PRODUCE_ITEMS.LAVENDER,  // 2x required
          ID_PRODUCE_ITEMS.LYCHEE,    // 2x required
          ID_POTION_ITEMS.POTION_FERTILIZER  // output
        ];
        break;
      default:
        console.warn(`getCraftPotionRemainingAccounts: Unknown potion type: ${potionType}`);
        return [];
    }
    
    // Ensure requiredItems is an array
    if (!Array.isArray(requiredItems)) {
      console.warn('getCraftPotionRemainingAccounts: requiredItems is not an array');
      return [];
    }
    
    // Add mint, ATA, and metadata accounts for each required item
    for (const itemId of requiredItems) {
      if (itemId == null || itemId === undefined) {
        console.warn('getCraftPotionRemainingAccounts: itemId is null/undefined, skipping');
        continue;
      }
      
      const mint = getItemMintPDA(itemId);
      const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
      const metadata = getMetadataPDA(mint);
      
      accounts.push({ pubkey: mint, isWritable: true, isSigner: false });
      accounts.push({ pubkey: ata, isWritable: true, isSigner: false });
      accounts.push({ pubkey: metadata, isWritable: true, isSigner: false });
    }
    
    // Add sponsor game token ATA (required for XP rewards)
    const sponsorGameAta = getAssociatedTokenAddressSync(GAME_TOKEN_MINT, publicKey, false);
    accounts.push({ pubkey: sponsorGameAta, isWritable: true, isSigner: false });
    
    return accounts;
  } catch (error) {
    console.error('getCraftPotionRemainingAccounts - error:', error);
    // Return empty array instead of throwing to prevent crashes
    return [];
  }
};