import { useState, useEffect, useMemo } from 'react';
import { ID_SEEDS, ID_PRODUCE_ITEMS, ID_BAIT_ITEMS, ID_FISH_ITEMS, ID_CHEST_ITEMS, ID_POTION_ITEMS, ID_CROP_CATEGORIES, ID_ITEM_CATEGORIES, ID_POTION_CATEGORIES, ID_LOOT_CATEGORIES, ID_RARE_TYPE } from '../constants/app_ids';
import { ALL_ITEMS, IMAGE_URL_CROP } from '../constants/item_data';
import { useSolanaWallet } from './useSolanaWallet';
import { fetchAllItemBalances } from '../solana/utils/inventoryUtils';

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// Inject sandbox items with a transparent pixel to hide their massive images in the UI
if (!ALL_ITEMS[9990]) ALL_ITEMS[9990] = { id: 9990, label: 'Stone Pipe', image: TRANSPARENT_PIXEL, category: ID_ITEM_CATEGORIES.LOOT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false };
if (!ALL_ITEMS[9991]) ALL_ITEMS[9991] = { id: 9991, label: 'Axe', image: TRANSPARENT_PIXEL, category: ID_ITEM_CATEGORIES.LOOT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false };
if (!ALL_ITEMS[9992]) ALL_ITEMS[9992] = { id: 9992, label: 'Pickaxe', image: TRANSPARENT_PIXEL, category: ID_ITEM_CATEGORIES.LOOT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false };
if (!ALL_ITEMS[9993]) ALL_ITEMS[9993] = { id: 9993, label: 'Wood Log', image: TRANSPARENT_PIXEL, category: ID_ITEM_CATEGORIES.LOOT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false };
if (!ALL_ITEMS[9994]) ALL_ITEMS[9994] = { id: 9994, label: 'Stone', image: TRANSPARENT_PIXEL, category: ID_ITEM_CATEGORIES.LOOT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false };
if (!ALL_ITEMS[9995]) ALL_ITEMS[9995] = { id: 9995, label: 'Sticks', image: TRANSPARENT_PIXEL, category: ID_ITEM_CATEGORIES.LOOT, subCategory: "MATERIALS", type: ID_RARE_TYPE.COMMON, usable: false };
if (!ALL_ITEMS[9996]) ALL_ITEMS[9996] = { id: 9996, label: 'Iron Ore', image: TRANSPARENT_PIXEL, category: ID_ITEM_CATEGORIES.LOOT, subCategory: "MATERIALS", type: ID_RARE_TYPE.UNCOMMON, usable: false };
if (!ALL_ITEMS[9997]) ALL_ITEMS[9997] = { id: 9997, label: 'Gold Ore', image: TRANSPARENT_PIXEL, category: ID_ITEM_CATEGORIES.LOOT, subCategory: "MATERIALS", type: ID_RARE_TYPE.RARE, usable: false };
ALL_ITEMS[9998] = { id: 9998, label: 'Water Sprinkler', image: TRANSPARENT_PIXEL, category: ID_ITEM_CATEGORIES.POTION, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.COMMON, usable: true };
ALL_ITEMS[9999] = { id: 9999, label: 'Umbrella', image: TRANSPARENT_PIXEL, category: ID_ITEM_CATEGORIES.POTION, subCategory: "FARM_GEAR", type: ID_RARE_TYPE.COMMON, usable: true };

export const useItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { connection, publicKey } = useSolanaWallet();

  // Get all item IDs from constants - memoize to prevent infinite loops
  const allItemIds = useMemo(() => [
    ...Object.values(ID_SEEDS),
    ...Object.values(ID_PRODUCE_ITEMS),
    ...Object.values(ID_BAIT_ITEMS),
    ...Object.values(ID_FISH_ITEMS),
    ...Object.values(ID_CHEST_ITEMS),
    ...Object.values(ID_POTION_ITEMS),
  ], []);
  
  const fetchItems = async () => {

    setLoading(true);
    setError(null);

    try {
      let balances = {};
      try {
        balances = await fetchAllItemBalances(connection, publicKey) || {};
      } catch (err) {
        console.warn("Sandbox Mode: Bypassing on-chain inventory fetch.");
      }

      // --- SANDBOX HACK: Give 10 of every seed ---
      Object.values(ID_SEEDS).forEach(seedId => {
        if (typeof seedId === 'number') {
          balances[seedId] = 10;
        }
      });

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
        
        let needsSave = false;
        if (sandboxLoot[ID_POTION_ITEMS.SCARECROW] === undefined) {
          sandboxLoot[ID_POTION_ITEMS.SCARECROW] = 10;
          needsSave = true;
        }
        if (sandboxLoot[ID_POTION_ITEMS.LADYBUG] === undefined) {
          sandboxLoot[ID_POTION_ITEMS.LADYBUG] = 10;
          needsSave = true;
        }
        if (sandboxLoot[9998] === undefined) {
          sandboxLoot[9998] = 10;
          needsSave = true;
        }
        if (sandboxLoot[9999] === undefined) {
          sandboxLoot[9999] = 10;
          needsSave = true;
        }
        if (needsSave) {
          localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        }

        Object.entries(sandboxLoot).forEach(([id, count]) => {
          balances[id] = (balances[id] || 0) + count;
        });
      } catch(e) {}
      
      // Add starter tools to match forest tracking logic
      balances[9991] = (balances[9991] || 0) + 5; // Axe
      balances[9992] = (balances[9992] || 0) + 5; // Pickaxe
      balances[9996] = (balances[9996] || 0) + 10; // Iron Ore

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
          }

          // Get proper label from constants
          let label = itemId.toString();
          if (Object.values(ID_CHEST_ITEMS).includes(itemId)) {
            // Find the chest label from ID_CHEST_ITEMS
            const chestEntry = Object.entries(ID_CHEST_ITEMS).find(([key, value]) => value === itemId);
            if (chestEntry) {
              label = chestEntry[0]; // Use the key as label (e.g., "CHEST_WOOD")
            }
          } else if (Object.values(ID_BAIT_ITEMS).includes(itemId)) {
            // Find the bait label from ID_BAIT_ITEMS
            const baitEntry = Object.entries(ID_BAIT_ITEMS).find(([key, value]) => value === itemId);
            if (baitEntry) {
              label = baitEntry[0]; // Use the key as label (e.g., "BAIT_I")
            }
          } else if (Object.values(ID_FISH_ITEMS).includes(itemId)) {
            // Find the fish label from ID_FISH_ITEMS
            const fishEntry = Object.entries(ID_FISH_ITEMS).find(([key, value]) => value === itemId);
            if (fishEntry) {
              label = fishEntry[0]; // Use the key as label
            }
          } else if (Object.values(ID_POTION_ITEMS).includes(itemId)) {
            // Find the potion label from ID_POTION_ITEMS
            const potionEntry = Object.entries(ID_POTION_ITEMS).find(([key, value]) => value === itemId);
            if (potionEntry) {
              label = potionEntry[0]; // Use the key as label (e.g., "POTION_FERTILIZER")
            }
          }

          // Create item data with proper categories
          userItems.push({
            id: itemId, // Ensure id is always a number
            count: balanceNum,
            category,
            subCategory,
            label,
            type: ID_RARE_TYPE.COMMON,
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
  };
  useEffect(() => {
    fetchItems();
  }, [connection, publicKey, allItemIds]);

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
                item.label?.includes('CHEST');
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
              node.id === ID_POTION_CATEGORIES.LADYBUG ||
              node.id === "FARM_GEAR") {
              return item.subCategory === node.id;
            }

            // Handle loot subcategories
            if (node.id === ID_LOOT_CATEGORIES.CHEST ||
                node.id === ID_LOOT_CATEGORIES.BAIT ||
                node.id === ID_LOOT_CATEGORIES.FISH ||
                node.id === "MATERIALS") {
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
                  { id: ID_PRODUCE_ITEMS.CABBAGE, label: "Cabbage" },
                  { id: ID_PRODUCE_ITEMS.ONION, label: "Onion" },
                  { id: ID_PRODUCE_ITEMS.RADISH, label: "Radish" },
                ]
              },
              {
                id: "FARM_GEAR",
                label: "Farm Gear",
                children: [
                  { id: 9998, label: "Water Sprinkler" },
                  { id: 9999, label: "Umbrella" }
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
                  { id: ID_PRODUCE_ITEMS.CHILI, label: "Chili" },
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
              },
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
                ]
              },
              {
                id: ID_POTION_CATEGORIES.LADYBUG,
                label: "Ladybugs",
                children: [
                  { id: ID_POTION_ITEMS.LADYBUG, label: "Ladybug" },
                ]
              },
              {
                id: "MATERIALS",
                label: "Materials",
                children: [
                  { id: 9991, label: "Axe" },
                  { id: 9992, label: "Pickaxe" },
                  { id: 9993, label: "Wood Log" },
                  { id: 9994, label: "Stone" },
                  { id: 9995, label: "Sticks" },
                  { id: 9990, label: "Stone Pipe" },
                  { id: 9996, label: "Iron Ore" },
                  { id: 9997, label: "Gold Ore" }
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
    seeds: items.filter(item => item.category === ID_ITEM_CATEGORIES.SEED),
    productions: items.filter(item => item.category === ID_ITEM_CATEGORIES.PRODUCE),
    baits: items.filter(item => item.category === ID_ITEM_CATEGORIES.BAIT),
    fish: items.filter(item => item.category === ID_ITEM_CATEGORIES.FISH),
    chests: items.filter(item => item.category === ID_ITEM_CATEGORIES.CHEST),
    potions: items.filter(item => item.category === ID_ITEM_CATEGORIES.POTION),
  };

  return {
    // Tree structure (same as ALL_ITEM_TREE format)
    items: itemsTree,
    seeds: itemsByCategory.seeds,
    // Legacy flat structure
    ...itemsByCategory,
    all: items,
    loading,
    error,
    refetch: fetchItems,
  };
};
