import { ALL_ITEMS } from "../constants/item_data";

export function generateId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatNumber(value) {
  const num = Number(value);

  if (isNaN(num)) return "-"; // invalid input
  if (num === 0) return "0.00"; // special case

  // Helper: format with 3 decimals, then trim trailing zeros but keep at least 2
  const format = (n) => {
    let str = n.toFixed(3);
    str = str.replace(/(\.\d*?[1-9])0+$/, "$1"); // trim trailing zeros
    if (/^\d+\.\d$/.test(str)) {
      str += "0"; // ensure at least 2 decimals
    }
    return str;
  };

  if (num >= 1_000_000_000) {
    return format(num / 1_000_000_000) + "B";
  } else if (num >= 1_000_000) {
    return format(num / 1_000_000) + "M";
  } else if (num >= 1_000) {
    return format(num / 1_000) + "K";
  } else {
    return format(num);
  }
}

export function formatAddress(address, chars = 4) {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// For the test
export const getRandomSeedEntry = () => {
  const entries = Object.entries(ALL_ITEMS);
  const randomIndex = Math.floor(Math.random() * entries.length);
  const [key, seed] = entries[randomIndex];
  return { id: key, ...seed };
};

export const isWalletConnected = () => {
  return true;
  // return false;
}