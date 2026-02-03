// Farming economic constants mirrored from on-chain programs

// Prices (6 decimals) by seed category
// 1: FEEBLE, 2: PICO, 3: BASIC, 4: PREMIUM
export const PRICE_FEeble = 1_000_000_000n;      // 1.0 HNY with 1e9 decimals
export const PRICE_PICO = 20_000_000_000n;       // 20.0 HNY with 1e9 decimals
export const PRICE_BASIC = 100_000_000_000n;     // 100.0 HNY with 1e9 decimals
export const PRICE_PREMIUM = 250_000_000_000n;   // 250.0 HNY with 1e9 decimals

// Locked ratio (in bps over 1000)
export const LOCKED_BPS = 166n; // matches consts.rs LOCKED_RATIO

// Mapping array [unused, FEEBLE, PICO, BASIC, PREMIUM]
export const PRICE_BY_CATEGORY = [
  0n,
  PRICE_FEeble,
  PRICE_PICO,
  PRICE_BASIC,
  PRICE_PREMIUM,
];

export const getBasePriceByCategory = (category /* 1..4 */) => {
  return PRICE_BY_CATEGORY[category] || 0n;
};


