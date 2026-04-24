export const SLOTS_PER_BAG = 15;

// Cost in gold (HNY) to unlock each additional bag. Index 0 = bag 2, index 4 = bag 6.
export const BAG_UPGRADE_COSTS = [500, 2000, 5000, 12000, 30000];
export const MAX_BAGS = 1 + BAG_UPGRADE_COSTS.length; // 6 bags max

export const getInventoryBags = () =>
  parseInt(localStorage.getItem('sandbox_inventory_bags') || '1', 10);

export const getInventoryMaxSlots = () => getInventoryBags() * SLOTS_PER_BAG;

// Each unique item type with count > 0 occupies one slot (seeds + produce + loot).
export const getProduceUsedSlots = () => {
  const produce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
  const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
  const produceCount = Object.values(produce).filter(c => Number(c) > 0).length;
  const lootCount = Object.values(loot).filter(c => Number(c) > 0).length;
  return produceCount + lootCount;
};

// Derive the produce item ID from a seedId.
export const seedIdToProduceId = (seedId) => {
  const base = seedId & 0xFFF;
  const seedCat = base >> 8;
  const subtype = base & 0xFF;
  return ((seedCat + 3) << 8) | subtype;
};

// Returns { canHarvest: bool, reason?: string }
// Only blocked if this is a brand-new item type AND all slots are occupied.
export const canHarvestProduce = (seedId) => {
  const produceId = seedIdToProduceId(seedId);
  const produce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
  const count = Number(produce[produceId] || 0);

  if (count > 0) return { canHarvest: true }; // existing slot — no limit on quantity

  const usedSlots = getProduceUsedSlots();
  const maxSlots = getInventoryMaxSlots();
  if (usedSlots >= maxSlots)
    return { canHarvest: false, reason: `Bag full (${usedSlots}/${maxSlots} slots). Go to the Banker to buy a new bag.` };

  return { canHarvest: true };
};
