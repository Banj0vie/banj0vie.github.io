import { ComputeBudgetProgram, PublicKey } from '@solana/web3.js';
import { GAME_TOKEN_MINT, SOLANA_VALLEY_PROGRAM_ID } from '../constants/programId';
import { SEEDS } from '../constants/seeds';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { CAT_CHEST, ID_CHEST_ITEMS, ID_SEEDS } from '../../constants/app_ids';
import { chestLootTable } from '../../utils/basic';
import { BN } from 'bn.js';


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
  ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
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
  const seedIds = getSeedIdsForTierFromAppIds(tier);
  if (!Array.isArray(seedIds) || seedIds.length === 0) throw new Error('No seedIds for tier');
  const seen = new Set();
  const accounts = [];
  for (const itemId of seedIds) {
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

export const getBankerDataPDA = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.BANKER_DATA)],
    SOLANA_VALLEY_PROGRAM_ID
  )[0];
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

export const getGameTokenMintAuthPDA = () => {
  const gameRegistryPda = getGameRegistryPDA();
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.GAME_TOKEN_MINT_AUTH), gameRegistryPda.toBuffer()],
    SOLANA_VALLEY_PROGRAM_ID,
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
