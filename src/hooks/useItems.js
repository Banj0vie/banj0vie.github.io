import { useState, useEffect, useMemo } from 'react';
import { useAgwEthersAndService } from '../hooks/useAgwEthersAndService';
import { ID_SEEDS, ID_PRODUCE_ITEMS, ID_BAIT_ITEMS, ID_FISH_ITEMS, ID_CHEST_ITEMS, ID_POTION_ITEMS, ID_CROP_CATEGORIES, ID_ITEM_CATEGORIES, ID_POTION_CATEGORIES, ID_POTIONS, ID_LOOT_CATEGORIES, ID_LOOTS, ID_RARE_TYPE } from '../constants/app_ids';
import { ALL_ITEMS, IMAGE_URL_CROP } from '../constants/item_data';

export const useItems = () => {
  const { account, contractService } = useAgwEthersAndService();
  const [items1155, setItems1155] = useState(null);
  const [publicClient, setPublicClient] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!contractService) return;
    setItems1155(contractService.getContract('ITEMS_1155'));
    setPublicClient(contractService.publicClient);
    setIsReady(true);
  }, [contractService]);
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
  useEffect(() => {
    const fetchItems = async () => {
      if (!items1155 || !account || !isReady || !publicClient) {
        setItems([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Create array of user addresses (same address for all items)
        const addresses = new Array(allItemIds.length).fill(account);
        
        // Convert item IDs to strings for the contract call
        const itemIdStrings = allItemIds.map(id => id.toString());
        // Fetch balances for all items at once
        const balances = await publicClient.readContract({
          address: items1155.address,
          abi: items1155.abi,
          functionName: 'balanceOfBatch',
          args: [addresses, itemIdStrings],
        });
        // Filter out items with zero balance and map to item objects
        const userItems = [];
        balances.forEach((balance, index) => {
          // Convert balance to number for comparison
          const balanceNum = typeof balance === 'object' && balance.toNumber ? balance.toNumber() : Number(balance);
          if (balanceNum > 0) {
            const itemId = allItemIds[index];
            const itemData = ALL_ITEMS[itemId];
            
            if (itemData) {
              // Item exists in ALL_ITEMS, use its data
              userItems.push({
                id: itemId,
                count: balanceNum,
                ...itemData
              });
            } else {
              // Item doesn't exist in ALL_ITEMS, create proper category structure
              let category, subCategory;
              
              // Determine category and subcategory based on item ID or label
              if (Object.values(ID_CHEST_ITEMS).includes(itemId)) {
                category = ID_ITEM_CATEGORIES.LOOT;
                subCategory = ID_LOOT_CATEGORIES.CHEST;
              } else if (Object.values(ID_POTION_ITEMS).includes(itemId)) {
                category = ID_ITEM_CATEGORIES.POTION;
                // Determine potion subcategory based on the specific potion
                if (itemId === ID_POTION_ITEMS.POTION_FERTILIZER) {
                  subCategory = ID_POTION_CATEGORIES.FERTILIZER;
                } else if (itemId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR) {
                  subCategory = ID_POTION_CATEGORIES.GROWTH_ELIXIR;
                } else if (itemId === ID_POTION_ITEMS.POTION_PESTICIDE) {
                  subCategory = ID_POTION_CATEGORIES.PESTICIDE;
                }
              } else {
                // Fallback for unknown items
                category = ID_ITEM_CATEGORIES.LOOT;
                subCategory = ID_LOOT_CATEGORIES.MISC;
              }
              
              // Get proper label from constants
              let label = itemId.toString();
              if (Object.values(ID_CHEST_ITEMS).includes(itemId)) {
                // Find the chest label from ID_CHEST_ITEMS
                const chestEntry = Object.entries(ID_CHEST_ITEMS).find(([key, value]) => value === itemId);
                if (chestEntry) {
                  label = chestEntry[0]; // Use the key as label (e.g., "CHEST_WOOD")
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
                id: itemId,
                count: balanceNum,
                category,
                subCategory,
                label,
                type: ID_RARE_TYPE.COMMON,
                image: IMAGE_URL_CROP,
                pos: 0
              });
            }
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

    fetchItems();
  }, [items1155, account, isReady, publicClient, allItemIds]);

  // Organize items into tree structure like ALL_ITEM_TREE but exclude seeds
  const itemsTree = useMemo(() => {
    const createTreeWithItems = (treeStructure, userItems) => {
      return treeStructure.map(node => {
        if (node.children) {
          // This is a category node - recursively process children
          const processedChildren = createTreeWithItems(node.children, userItems);
          
          // Add items property to category nodes (exclude seeds)
          const categoryItems = userItems.filter(item => {
            if (node.id === ID_ITEM_CATEGORIES.CROP) {
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
                node.id === ID_POTION_CATEGORIES.PESTICIDE) {
              return item.subCategory === node.id;
            }
            
            // Handle loot subcategories
            if (node.id === ID_LOOT_CATEGORIES.CHEST ||
                node.id === ID_LOOT_CATEGORIES.BAIT ||
                node.id === ID_LOOT_CATEGORIES.FISH ||
                node.id === ID_LOOT_CATEGORIES.MISC) {
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
            id: ID_ITEM_CATEGORIES.CROP,
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
                  { id: ID_POTIONS.GROWTH_ELIXIR, label: "Growth Elixir I" },
                  { id: ID_POTIONS.GROWTH_ELIXIR_II, label: "Growth Elixir II" },
                  { id: ID_POTIONS.GROWTH_ELIXIR_III, label: "Growth Elixir III" },
                ]
              },
              {
                id: ID_POTION_CATEGORIES.FERTILIZER,
                label: "Fertilizers",
                children: [
                  { id: ID_POTIONS.FERTILIZER, label: "Fertilizer" },
                  { id: ID_POTIONS.FERTILIZER_II, label: "Fertilizer II" },
                  { id: ID_POTIONS.FERTILIZER_III, label: "Fertilizer III" },
                ]
              },
              {
                id: ID_POTION_CATEGORIES.PESTICIDE,
                label: "Pesticides",
                children: [
                  { id: ID_POTIONS.PESTICIDE, label: "Pesticide" },
                  { id: ID_POTIONS.PESTICIDE_II, label: "Pesticide II" },
                  { id: ID_POTIONS.PESTICIDE_III, label: "Pesticide III" },
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
                  { id: ID_LOOTS.WOODEN_CHEST, label: "Wooden Chest" },
                  { id: ID_LOOTS.BRONZE_CHEST, label: "Bronze Chest" },
                  { id: ID_LOOTS.SILVER_CHEST, label: "Silver Chest" },
                  { id: ID_LOOTS.GOLDEN_CHEST, label: "Golden Chest" },
                  { id: ID_LOOTS.PLATINUM_CHEST, label: "Platinum Chest" },
                ]
              },
              {
                id: ID_LOOT_CATEGORIES.BAIT,
                label: "Baits",
                children: [
                  { id: ID_LOOTS.BAIT_I, label: "Bait I" },
                  { id: ID_LOOTS.BAIT_II, label: "Bait II" },
                  { id: ID_LOOTS.BAIT_III, label: "Bait III" }
                ]
              },
              {
                id: ID_LOOT_CATEGORIES.FISH,
                label: "Fish",
                children: [
                  { id: ID_LOOTS.ANCHOVY, label: "Anchovy" },
                  { id: ID_LOOTS.SARDINE, label: "Sardine" },
                  { id: ID_LOOTS.HERRING, label: "Herring" },
                  { id: ID_LOOTS.SMALL_TROUT, label: "Small Trout" },
                  { id: ID_LOOTS.YELLOW_PERCH, label: "Yellow Perch" },
                  { id: ID_LOOTS.SALMON, label: "Salmon" },
                  { id: ID_LOOTS.ORANGE_ROUGHY, label: "Orange Roughy" },
                  { id: ID_LOOTS.CATFISH, label: "Catfish" },
                  { id: ID_LOOTS.SMALL_SHARK, label: "Small Shark" },
                ]
              },
              {
                id: ID_LOOT_CATEGORIES.MISC,
                label: "Misc",
                children: [
                  { id: ID_LOOTS.LIFE_BUD, label: "Life Bud" },
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
    refetch: () => {
      if (items1155 && account && isReady && publicClient) {
        const fetchItems = async () => {
          setLoading(true);
          setError(null);

          try {
            const addresses = new Array(allItemIds.length).fill(account);
            const itemIdStrings = allItemIds.map(id => id.toString());
            const balances = await publicClient.readContract({
              address: items1155.address,
              abi: items1155.abi,
              functionName: 'balanceOfBatch',
              args: [addresses, itemIdStrings],
            });
            
            const userItems = [];
            balances.forEach((balance, index) => {
              // Convert balance to number for comparison
              const balanceNum = typeof balance === 'object' && balance.toNumber ? balance.toNumber() : Number(balance);
              if (balanceNum > 0) {
                const itemId = allItemIds[index];
                const itemData = ALL_ITEMS[itemId];
                if (itemData) {
                  userItems.push({
                    id: itemId,
                    count: balanceNum,
                    ...itemData
                  });
                }
              }
            });

            setItems(userItems);
          } catch (err) {
            console.error('Failed to refetch items:', err);
            setError(err.message);
          } finally {
            setLoading(false);
          }
        };
        fetchItems();
      }
    }
  };
};
