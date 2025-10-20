/* global BigInt */
export function bnToNumber(bn, divisor = 1_000_000) {
  if (!bn) return 0;
  if (typeof bn === "number") return bn / divisor;
  if (typeof bn.toNumber === "function") {
    try {
      return bn.toNumber() / divisor;
    } catch {
      return 0;
    }
  }
  if (typeof bn.toString === "function") {
    const asBigInt = BigInt(bn.toString());
    return Number(asBigInt / BigInt(divisor));
  }
  return 0;
}
