import { useState, useEffect, useMemo, useCallback } from 'react';
import { ID_SEEDS, ID_PRODUCE_ITEMS, ID_BAIT_ITEMS, ID_FISH_ITEMS, ID_CHEST_ITEMS, ID_POTION_ITEMS, ID_CROP_CATEGORIES, ID_ITEM_CATEGORIES, ID_POTION_CATEGORIES, ID_LOOT_CATEGORIES, ID_RARE_TYPE } from '../constants/app_ids';
import { ALL_ITEMS, IMAGE_URL_CROP } from '../constants/item_data';

const SB_CAT = ID_ITEM_CATEGORIES?.ITEM ?? ID_ITEM_CATEGORIES?.ITEMS ?? ID_ITEM_CATEGORIES?.TOOL ?? ID_ITEM_CATEGORIES?.LOOT ?? 4;

// Inject sandbox items with actual images to show up in the UI, keeping iconSize: 'text' to match text sizing
ALL_ITEMS[9987] = { id: 9987, label: 'Easter Basket', image: '/images/items/seeds.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.EPIC, usable: true, iconSize: 'text' };
ALL_ITEMS[9998] = { id: 9998, label: 'Water Sprinkler', image: '/images/items/watersprinkler.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.COMMON, usable: true, iconSize: 'text' };
ALL_ITEMS[9999] = { id: 9999, label: 'Umbrella', image: '/images/items/umbrella.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.COMMON, usable: true, iconSize: 'text' };
if (!ALL_ITEMS[9940]) ALL_ITEMS[9940] = { id: 9940, label: 'Egg Basket', image: '/images/barn/basket.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9939]) ALL_ITEMS[9939] = { id: 9939, label: 'Wool', image: '/images/barn/wool.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9938]) ALL_ITEMS[9938] = { id: 9938, label: 'Milk', image: '/images/barn/milk.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9941]) ALL_ITEMS[9941] = { id: 9941, label: 'Normal Egg', image: '/images/barn/egg.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[ID_BAIT_ITEMS?.BAIT_I || 30001]) ALL_ITEMS[ID_BAIT_ITEMS?.BAIT_I || 30001] = { id: ID_BAIT_ITEMS?.BAIT_I || 30001, label: 'Bait I', image: '/images/items/seeds.png', category: ID_ITEM_CATEGORIES.LOOT, subCategory: "BAIT", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[ID_BAIT_ITEMS?.BAIT_II || 30002]) ALL_ITEMS[ID_BAIT_ITEMS?.BAIT_II || 30002] = { id: ID_BAIT_ITEMS?.BAIT_II || 30002, label: 'Bait II', image: '/images/items/seeds.png', category: ID_ITEM_CATEGORIES.LOOT, subCategory: "BAIT", type: ID_RARE_TYPE.UNCOMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[ID_BAIT_ITEMS?.BAIT_III || 30003]) ALL_ITEMS[ID_BAIT_ITEMS?.BAIT_III || 30003] = { id: ID_BAIT_ITEMS?.BAIT_III || 30003, label: 'Bait III', image: '/images/items/seeds.png', category: ID_ITEM_CATEGORIES.LOOT, subCategory: "BAIT", type: ID_RARE_TYPE.RARE, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9955]) ALL_ITEMS[9955] = { id: 9955, label: 'Yarn', image: '/images/pets/yarn.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.COMMON, usable: true, iconSize: 'text' };
if (!ALL_ITEMS[9979]) ALL_ITEMS[9979] = { id: 9979, label: 'Ladybug Scarecrow', image: '/images/scarecrow/ladybug_scarecrow.png', category: ID_ITEM_CATEGORIES.POTION, subCategory: ID_POTION_CATEGORIES.SCARECROW, type: ID_RARE_TYPE.EPIC, usable: true, iconSize: 'text' };
if (!ALL_ITEMS[9978]) ALL_ITEMS[9978] = { id: 9978, label: 'Tier 2 Scarecrow', image: '/images/scarecrow/tier2.png', category: ID_ITEM_CATEGORIES.POTION, subCategory: ID_POTION_CATEGORIES.SCARECROW, type: ID_RARE_TYPE.UNCOMMON, usable: true, iconSize: 'text' };
if (!ALL_ITEMS[9977]) ALL_ITEMS[9977] = { id: 9977, label: 'Tier 3 Scarecrow', image: '/images/scarecrow/tier3.png', category: ID_ITEM_CATEGORIES.POTION, subCategory: ID_POTION_CATEGORIES.SCARECROW, type: ID_RARE_TYPE.RARE, usable: true, iconSize: 'text' };
if (!ALL_ITEMS[9976]) ALL_ITEMS[9976] = { id: 9976, label: 'Max Tier Scarecrow', image: '/images/scarecrow/tier4.png', category: ID_ITEM_CATEGORIES.POTION, subCategory: ID_POTION_CATEGORIES.SCARECROW, type: ID_RARE_TYPE.LEGENDARY, usable: true, iconSize: 'text' };
if (!ALL_ITEMS[9975]) ALL_ITEMS[9975] = { id: 9975, label: 'Tesla Tower', image: '/images/items/tesla.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.EPIC, usable: true, iconSize: 'text' };
if (!ALL_ITEMS[9974]) ALL_ITEMS[9974] = { id: 9974, label: 'Copper Ore', image: '/images/forest/copperrock.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9973]) ALL_ITEMS[9973] = { id: 9973, label: 'Coal', image: '/images/forest/coalrock.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9972]) ALL_ITEMS[9972] = { id: 9972, label: 'Hemp', image: '/images/crafting/hemp_rope.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9971]) ALL_ITEMS[9971] = { id: 9971, label: 'Cotton', image: '/images/crafting/cotton.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9970]) ALL_ITEMS[9970] = { id: 9970, label: 'Rope', image: '/images/crafting/hemp_rope.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9969]) ALL_ITEMS[9969] = { id: 9969, label: 'Canvas', image: '/images/crafting/canvas.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9968]) ALL_ITEMS[9968] = { id: 9968, label: 'Copper Nails', image: '/images/crafting/copper_nails.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9967]) ALL_ITEMS[9967] = { id: 9967, label: 'Steel Plate', image: '/images/crafting/steel_plate.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9966]) ALL_ITEMS[9966] = { id: 9966, label: 'Crab Pot', image: '/images/items/crab_pot.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.UNCOMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9965]) ALL_ITEMS[9965] = { id: 9965, label: 'Rowboat', image: '/images/items/rowboat.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.RARE, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9964]) ALL_ITEMS[9964] = { id: 9964, label: 'Sailboat', image: '/images/items/sailboat.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.EPIC, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9963]) ALL_ITEMS[9963] = { id: 9963, label: 'Trawler', image: '/images/items/trawler.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.LEGENDARY, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9962]) ALL_ITEMS[9962] = { id: 9962, label: 'Engine', image: '/images/crafting/engine.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.EPIC, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9956]) ALL_ITEMS[9956] = { id: 9956, label: 'Leaves', image: '/images/items/seeds.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9991]) ALL_ITEMS[9991] = { id: 9991, label: 'Axe', image: '/images/forest/axe.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.COMMON, usable: true, iconSize: 'text' };
if (!ALL_ITEMS[9992]) ALL_ITEMS[9992] = { id: 9992, label: 'Pickaxe', image: '/images/forest/picaxe.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.COMMON, usable: true, iconSize: 'text' };
if (!ALL_ITEMS[9981]) ALL_ITEMS[9981] = { id: 9981, label: 'Iron Pickaxe', image: '/images/forest/picaxe.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.COMMON, usable: true, iconSize: 'text' };
if (!ALL_ITEMS[9993]) ALL_ITEMS[9993] = { id: 9993, label: 'Wood Log', image: '/images/forest/wood.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9942]) ALL_ITEMS[9942] = { id: 9942, label: 'Special Wood', image: '/images/forest/wood.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9994]) ALL_ITEMS[9994] = { id: 9994, label: 'Stone', image: '/images/forest/rock.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9995]) ALL_ITEMS[9995] = { id: 9995, label: 'Sticks', image: '/images/forest/wood.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9989]) ALL_ITEMS[9989] = { id: 9989, label: 'Wooden Plank', image: '/images/forest/wood.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9990]) ALL_ITEMS[9990] = { id: 9990, label: 'Stone Pipe', image: '/images/forest/rock.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9996]) ALL_ITEMS[9996] = { id: 9996, label: 'Iron Ore', image: '/images/forest/ironrock.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9997]) ALL_ITEMS[9997] = { id: 9997, label: 'Gold Ore', image: '/images/forest/goldrock.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9960]) ALL_ITEMS[9960] = { id: 9960, label: 'Blue Gem', image: '/images/items/seeds.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.RARE, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9961]) ALL_ITEMS[9961] = { id: 9961, label: 'Red Gem', image: '/images/items/seeds.png', category: SB_CAT, subCategory: "MATERIALS", type: ID_RARE_TYPE.RARE, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9953]) ALL_ITEMS[9953] = { id: 9953, label: 'Bucket', image: '/images/forest/wood.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.COMMON, usable: false, iconSize: 'text' };
if (!ALL_ITEMS[9954]) ALL_ITEMS[9954] = { id: 9954, label: 'Magic Ring', image: '/images/items/seeds.png', category: SB_CAT, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.EPIC, usable: false, iconSize: 'text' };

// Create an instant lookup map for labels to avoid repetitive loops
const REVERSE_LABEL_MAP = Object.fromEntries(
  Object.entries({
    ...ID_CHEST_ITEMS, ...ID_BAIT_ITEMS, ...ID_FISH_ITEMS, ...ID_POTION_ITEMS, ...ID_SEEDS
  }).map(([key, value]) => [value, key])
);

export const useItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Get all item IDs from constants - memoize to prevent infinite loops
  const allItemIds = useMemo(() => [
    ...Object.values(ID_SEEDS),
    ...Object.values(ID_PRODUCE_ITEMS),
    ...Object.values(ID_BAIT_ITEMS),
    ...Object.values(ID_FISH_ITEMS),
    ...Object.values(ID_CHEST_ITEMS),
    ...Object.values(ID_POTION_ITEMS),
  ], []);
  
  const fetchItems = useCallback(async () => {

    setLoading(true);
    setError(null);

    try {
      // Sandbox-only: balances live entirely in localStorage. The on-chain
      // path was removed when the wallet integration was deleted.
      let balances = {};

      // --- SANDBOX HACK: Load harvested produce ---
      try {
        const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
        
        let needsFix = false;
        const fixedProduce = {};
        Object.entries(sandboxProduce).forEach(([produceId, val]) => {
          const count = Array.isArray(val) ? val.length : Number(val);
          if (Array.isArray(val)) needsFix = true;
          fixedProduce[produceId] = count;
          balances[produceId] = (balances[produceId] || 0) + count;
        });
        if (needsFix) {
          localStorage.setItem('sandbox_produce', JSON.stringify(fixedProduce));
        }
      } catch(e) {}

      // --- SANDBOX HACK: Load crafted loot/bait ---
      try {
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        
        Object.entries(sandboxLoot).forEach(([id, count]) => {
          balances[id] = (balances[id] || 0) + count;
        });
      } catch(e) {}
      
      // Pre-fill balances with 0 for all known items to ensure they show up in UI
      Object.keys(ALL_ITEMS).forEach(id => {
        if (balances[id] === undefined) {
          balances[id] = 0;
        }
      });

      // Include ALL items (even with 0 balance) for crafting interface
      const userItems = [];
      Object.entries(balances).forEach(([itemIdStr, balance]) => {
        // Convert balance to number for comparison
        const balanceNum = typeof balance === 'object' && balance.toNumber ? balance.toNumber() : Number(balance);
        const itemId = Number(itemIdStr);
        if (isNaN(itemId)) return; // Auto-heals corrupted undefined items

        const itemData = ALL_ITEMS[itemId];
        if (itemData) {
        // Item exists in ALL_ITEMS, use its data
          const item = {
            ...itemData,
            id: itemId, // Ensure id is always a number
            count: balanceNum,
          };
          
          userItems.push(item);
        } else {
          // Item doesn't exist in ALL_ITEMS, create proper category structure
          let category, subCategory;

          // Determine category and subcategory based on item ID or label
          if (Object.values(ID_CHEST_ITEMS).includes(itemId)) {
            category = ID_ITEM_CATEGORIES.LOOT;
            subCategory = ID_LOOT_CATEGORIES.CHEST;
          } else if (Object.values(ID_BAIT_ITEMS).includes(itemId)) {
            category = ID_ITEM_CATEGORIES.LOOT;
            subCategory = ID_LOOT_CATEGORIES.BAIT;
          } else if (Object.values(ID_FISH_ITEMS).includes(itemId)) {
            category = ID_ITEM_CATEGORIES.LOOT;
            subCategory = ID_LOOT_CATEGORIES.FISH;
          } else if (Object.values(ID_POTION_ITEMS).includes(itemId)) {
            category = ID_ITEM_CATEGORIES.POTION;
            // Determine potion subcategory based on the specific potion
            if (itemId === ID_POTION_ITEMS.POTION_FERTILIZER) {
              subCategory = ID_POTION_CATEGORIES.FERTILIZER;
            } else if (itemId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR) {
              subCategory = ID_POTION_CATEGORIES.GROWTH_ELIXIR;
            } else if (itemId === ID_POTION_ITEMS.POTION_PESTICIDE) {
              subCategory = ID_POTION_CATEGORIES.PESTICIDE;
            } else if (itemId === ID_POTION_ITEMS.SCARECROW) {
              subCategory = ID_POTION_CATEGORIES.SCARECROW;
            } else if (itemId === ID_POTION_ITEMS.LADYBUG) {
              subCategory = ID_POTION_CATEGORIES.LADYBUG;
            }
          } else if (Object.values(ID_SEEDS || {}).includes(itemId)) {
            category = ID_ITEM_CATEGORIES?.SEED || 'ID_ITEM_SEED';
          }

          // Get proper label from constants
          const label = REVERSE_LABEL_MAP[itemId] || itemId.toString();

          // Create item data with proper categories
          userItems.push({
            id: itemId, // Ensure id is always a number
            count: balanceNum,
            category,
            subCategory,
            label,
            type: ID_RARE_TYPE.COMMON,
            iconSize: 'default', // Ensure iconSize defaults if not set in ALL_ITEMS
            image: IMAGE_URL_CROP,
        pos: 0
          });
        }
      });

      setItems(userItems);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, allItemIds]);


  // Organize items into tree structure like ALL_ITEM_TREE but exclude seeds
  const itemsTree = useMemo(() => {
    const createTreeWithItems = (treeStructure, userItems) => {
      return treeStructure.map(node => {
        if (node.children) {
          // This is a category node - recursively process children
          const processedChildren = createTreeWithItems(node.children, userItems);

          // Add items property to category nodes (exclude seeds, include all items even with 0 count for crafting)
          const categoryItems = userItems.filter(item => {
            if (node.id === ID_ITEM_CATEGORIES.PRODUCE) {
              // Only include produce items, exclude seeds
              return item.category === ID_ITEM_CATEGORIES.PRODUCE;
            }

            // Handle potion items
            if (node.id === ID_ITEM_CATEGORIES.POTION) {
              return item.category === ID_ITEM_CATEGORIES.POTION;
            }

            // Handle loot items (including chests with undefined category)
            if (node.id === ID_ITEM_CATEGORIES.LOOT) {
              // Include items with loot category or undefined category (like chests)
              return item.category === ID_ITEM_CATEGORIES.LOOT ||
                item.category === undefined ||
                item.label?.includes('CHEST') ||
                item.category === 'ITEM' ||
                item.category === SB_CAT;
            }

            // Handle crop subcategories (for crops that are organized by seed tier)
            if (node.id === ID_CROP_CATEGORIES.PREMIUM_SEED ||
              node.id === ID_CROP_CATEGORIES.BASIC_SEED ||
              node.id === ID_CROP_CATEGORIES.PICO_SEED ||
              node.id === ID_CROP_CATEGORIES.FEEBLE_SEED) {
              // For crop subcategories, we need to match produce items that belong to this seed tier
              // This is a bit tricky since produce items don't have subcategory, so we'll match by ID ranges
              const tierItems = node.children?.map(child => child.id) || [];
              return tierItems.includes(item.id);
            }

            // Handle potion subcategories
            if (node.id === ID_POTION_CATEGORIES.GROWTH_ELIXIR ||
              node.id === ID_POTION_CATEGORIES.FERTILIZER ||
              node.id === ID_POTION_CATEGORIES.PESTICIDE ||
              node.id === ID_POTION_CATEGORIES.SCARECROW ||
              node.id === ID_POTION_CATEGORIES.LADYBUG) {
              return item.subCategory === node.id;
            }

            // Handle loot subcategories
            if (node.id === ID_LOOT_CATEGORIES.CHEST ||
                node.id === ID_LOOT_CATEGORIES.BAIT ||
                node.id === ID_LOOT_CATEGORIES.FISH ||
                node.id === "MATERIALS" ||
                node.id === "FARM_GEAR") {
              return item.subCategory === node.id;
            }

            return item.category === node.id;
          });

          return {
            ...node,
            children: processedChildren,
            items: categoryItems.length > 0 ? categoryItems : undefined
          };
        } else {
          // This is a leaf node (individual item) - find by ID or label match
          const userItem = userItems.find(item => {
            // First try exact ID match
            if (item.id === node.id) return true;

            // If no ID match, try label match for items with undefined IDs
            if (item.label && node.label && item.label === node.label) return true;

            return false;
          });

          return {
            ...node,
            ...userItem,
            count: userItem?.count || 0
          };
        }
      });
    };

    // Base tree structure (exact same as ALL_ITEM_TREE but without seeds)
    const baseTree = [
      {
        id: "ALL",
        label: "All",
        children: [
          {
            id: ID_ITEM_CATEGORIES.PRODUCE,
            label: "Crops",
            children: [
              {
                id: ID_CROP_CATEGORIES.PICO_SEED,
                label: "Pico Crops",
                children: [
                  { id: ID_PRODUCE_ITEMS.POTATO, label: "Potato" },
                  { id: ID_PRODUCE_ITEMS.LETTUCE, label: "Lettuce" },
                  { id: ID_PRODUCE_ITEMS.CABBAGE, label: "Celery" },
                  { id: ID_PRODUCE_ITEMS.ONION, label: "Onion" },
                  { id: ID_PRODUCE_ITEMS.RADISH, label: "Radish" },
                ]
              },
              {
                id: ID_CROP_CATEGORIES.BASIC_SEED,
                label: "Basic Crops",
                children: [
                  { id: ID_PRODUCE_ITEMS.WHEAT, label: "Wheat" },
                  { id: ID_PRODUCE_ITEMS.TOMATO, label: "Tomato" },
                  { id: ID_PRODUCE_ITEMS.CARROT, label: "Carrot" },
                  { id: ID_PRODUCE_ITEMS.CORN, label: "Corn" },
                  { id: ID_PRODUCE_ITEMS.PUMPKIN, label: "Pumpkin" },
                  { id: ID_PRODUCE_ITEMS.PEPPER, label: "Pepper" },
                  { id: ID_PRODUCE_ITEMS.PARSNAP, label: "Parsnip" },
                  { id: ID_PRODUCE_ITEMS.CELERY, label: "Celery" },
                  { id: ID_PRODUCE_ITEMS.BROCCOLI, label: "Broccoli" },
                  { id: ID_PRODUCE_ITEMS.CAULIFLOWER, label: "Cauliflower" },
                  { id: ID_PRODUCE_ITEMS.BERRY, label: "Berry" },
                  { id: ID_PRODUCE_ITEMS.GRAPES, label: "Grapes" },
                ]
              },
              {
                id: ID_CROP_CATEGORIES.PREMIUM_SEED,
                label: "Premium Crops",
                children: [
                  { id: ID_PRODUCE_ITEMS.BANANA, label: "Banana" },
                  { id: ID_PRODUCE_ITEMS.MANGO, label: "Mango" },
                  { id: ID_PRODUCE_ITEMS.AVOCADO, label: "Avocado" },
                  { id: ID_PRODUCE_ITEMS.PINEAPPLE, label: "Pineapple" },
                  { id: ID_PRODUCE_ITEMS.BLUEBERRY, label: "Blueberry" },
                  { id: ID_PRODUCE_ITEMS.ARTICHOKE, label: "Artichoke" },
                  { id: ID_PRODUCE_ITEMS.PAPAYA, label: "Papaya" },
                  { id: ID_PRODUCE_ITEMS.FIG, label: "Fig" },
                  { id: ID_PRODUCE_ITEMS.LYCHEE, label: "Lychee" },
                  { id: ID_PRODUCE_ITEMS.LAVENDER, label: "Lavender" },
                  { id: ID_PRODUCE_ITEMS.DRAGONFRUIT, label: "Dragon Fruit" },
                ]
              }
            ],
          },
          {
            id: ID_ITEM_CATEGORIES.POTION,
            label: "Potions",
            children: [
              {
                id: ID_POTION_CATEGORIES.GROWTH_ELIXIR,
                label: "Growth Elixirs",
                children: [
                  { id: ID_POTION_ITEMS.GROWTH_ELIXIR, label: "Growth Elixir I" },
                  { id: ID_POTION_ITEMS.GROWTH_ELIXIR_II, label: "Growth Elixir II" },
                  { id: ID_POTION_ITEMS.GROWTH_ELIXIR_III, label: "Growth Elixir III" },
                ]
              },
              {
                id: ID_POTION_CATEGORIES.FERTILIZER,
                label: "Fertilizers",
                children: [
                  { id: ID_POTION_ITEMS.FERTILIZER, label: "Fertilizer" },
                  { id: ID_POTION_ITEMS.FERTILIZER_II, label: "Fertilizer II" },
                  { id: ID_POTION_ITEMS.FERTILIZER_III, label: "Fertilizer III" },
                ]
              },
              {
                id: ID_POTION_CATEGORIES.PESTICIDE,
                label: "Pesticides",
                children: [
                  { id: ID_POTION_ITEMS.PESTICIDE, label: "Pesticide" },
                  { id: ID_POTION_ITEMS.PESTICIDE_II, label: "Pesticide II" },
                  { id: ID_POTION_ITEMS.PESTICIDE_III, label: "Pesticide III" },
                ]
              },
              {
                id: ID_POTION_CATEGORIES.SCARECROW,
                label: "Scarecrows",
                children: [
                  { id: ID_POTION_ITEMS.SCARECROW, label: "Scarecrow" },
                  { id: 9978, label: "Tier 2 Scarecrow" },
                  { id: 9977, label: "Tier 3 Scarecrow" },
                  { id: 9976, label: "Max Tier Scarecrow" },
                  { id: 9979, label: "Ladybug Scarecrow" }
                ]
              },
              {
                id: ID_POTION_CATEGORIES.LADYBUG,
                label: "Ladybugs",
                children: [
                  { id: ID_POTION_ITEMS.LADYBUG, label: "Ladybug" },
                ]
              }
            ]
          },
          {
            id: ID_ITEM_CATEGORIES.LOOT,
            label: "Loot",
            children: [
              {
                id: ID_LOOT_CATEGORIES.CHEST,
                label: "Chests",
                children: [
                  { id: ID_CHEST_ITEMS.WOODEN_CHEST, label: "Wooden Chest" },
                  { id: ID_CHEST_ITEMS.BRONZE_CHEST, label: "Bronze Chest" },
                  { id: ID_CHEST_ITEMS.SILVER_CHEST, label: "Silver Chest" },
                  { id: ID_CHEST_ITEMS.GOLDEN_CHEST, label: "Golden Chest" },
                ]
              },
              {
                id: ID_LOOT_CATEGORIES.BAIT,
                label: "Baits",
                children: [
                  { id: ID_BAIT_ITEMS.BAIT_I, label: "Bait I" },
                  { id: ID_BAIT_ITEMS.BAIT_II, label: "Bait II" },
                  { id: ID_BAIT_ITEMS.BAIT_III, label: "Bait III" }
                ]
              },
              {
                id: ID_LOOT_CATEGORIES.FISH,
                label: "Fishes",
                children: [
                  { id: ID_FISH_ITEMS.NORMAL_FISH, label: "Normal fish" }
                ]
              },
              {
                id: "FARM_GEAR",
                label: "Farm Gear",
                children: [
                  { id: 9998, label: "Water Sprinkler" },
                  { id: 9999, label: "Umbrella" },
                  { id: 9987, label: "Easter Basket" },
                  { id: 9953, label: "Bucket" },
                  { id: 9954, label: "Magic Ring" },
                  { id: 9955, label: "Yarn" },
                  { id: 9940, label: "Egg Basket" },
                  { id: 9975, label: "Tesla Tower" },
                  { id: 9966, label: "Crab Pot" },
                  { id: 9965, label: "Rowboat" },
                  { id: 9964, label: "Sailboat" },
                  { id: 9963, label: "Trawler" }
                ]
              },
              {
                id: "MATERIALS",
                label: "Materials",
                children: [
                  { id: 9991, label: "Axe" },
                  { id: 9992, label: "Pickaxe" },
                  { id: 9981, label: "Iron Pickaxe" },
                  { id: 9993, label: "Wood Log" },
                  { id: 9942, label: "Special Wood" },
                  { id: 9994, label: "Stone" },
                  { id: 9995, label: "Sticks" },
                  { id: 9989, label: "Wooden Plank" },
                  { id: 9990, label: "Stone Pipe" },
                  { id: 9996, label: "Iron Ore" },
                  { id: 9997, label: "Gold Ore" },
                  { id: 9960, label: "Blue Gem" },
                  { id: 9961, label: "Red Gem" },
                  { id: 9962, label: "Green Gem" },
                  { id: 9963, label: "Yellow Gem" },
                  { id: 9950, label: "Hearty Stew" },
                  { id: 9951, label: "Fish & Chips" },
                  { id: 9952, label: "Tomato Soup" },
                  { id: 9988, label: "Bug Net" },
                  { id: 9982, label: "Red Egg" },
                  { id: 9983, label: "Yellow Egg" },
                  { id: 9984, label: "Blue Egg" },
                  { id: 9985, label: "Purple Egg" },
                  { id: 9986, label: "Green Egg" },
                  { id: 9939, label: "Wool" },
                  { id: 9938, label: "Milk" },
                  { id: 9941, label: "Normal Egg" },
                  { id: 9974, label: "Copper Ore" },
                  { id: 9973, label: "Coal" },
                  { id: 9972, label: "Hemp" },
                  { id: 9971, label: "Cotton" },
                  { id: 9970, label: "Rope" },
                  { id: 9969, label: "Canvas" },
                  { id: 9968, label: "Copper Nails" },
                  { id: 9967, label: "Steel Plate" },
                  { id: 9962, label: "Engine" },
                  { id: 9956, label: "Leaves" }
                ]
              }
            ]
          }
        ],
      },
    ];

    return createTreeWithItems(baseTree, items);
  }, [items]);

  // Legacy flat structure for backward compatibility
  const itemsByCategory = {
    seeds: items.filter(item => item.category === ID_ITEM_CATEGORIES?.SEED || item.category === 'ID_ITEM_SEED'),
    productions: items.filter(item => item.category === ID_ITEM_CATEGORIES?.PRODUCE || item.category === 'ID_ITEM_CROP'),
    baits: items.filter(item => item.category === ID_ITEM_CATEGORIES?.BAIT || (item.category === 'ID_ITEM_LOOT' && item.subCategory === 'ID_LOOT_CATEGORY_BAIT')),
    fish: items.filter(item => item.category === ID_ITEM_CATEGORIES?.FISH || (item.category === 'ID_ITEM_LOOT' && item.subCategory === 'ID_LOOT_CATEGORY_FISH')),
    chests: items.filter(item => item.category === ID_ITEM_CATEGORIES?.CHEST || (item.category === 'ID_ITEM_LOOT' && item.subCategory === 'ID_LOOT_CATEGORY_CHEST') || item.label?.includes('CHEST')),
    potions: items.filter(item => item.category === ID_ITEM_CATEGORIES?.POTION || item.category === 'ID_ITEM_POTION'),
    items: items.filter(item => item.category === ID_ITEM_CATEGORIES?.LOOT || item.label?.includes('CHEST') || item.category === 'ITEM' || item.category === 'ID_ITEM_LOOT' || item.category === SB_CAT),
    loot: items.filter(item => item.category === ID_ITEM_CATEGORIES?.LOOT || item.category === 'ITEM' || item.category === 'ID_ITEM_LOOT' || item.category === SB_CAT),
  };

  return {
    // Tree structure (same as ALL_ITEM_TREE format)
    itemsTree: itemsTree,
    seeds: itemsByCategory.seeds,
    // Legacy flat structure
    ...itemsByCategory,
    all: items,
    loading,
    error,
    refetch: fetchItems,
  };

};
