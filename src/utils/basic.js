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

export const formatDuration = (timestampMs) => {
  // If input is in seconds, convert to ms
  let totalSeconds = Math.floor(timestampMs / 1000);

  const days = Math.floor(totalSeconds / (24 * 3600));
  totalSeconds %= 24 * 3600;

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let result = [];
  if (days > 0) result.push(`${days}d`);
  if (hours > 0) result.push(`${hours}h`);
  if (minutes > 0) result.push(`${minutes}m`);
  if (seconds > 0 || result.length === 0) result.push(`${seconds}s`);

  return result.join(" ");
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