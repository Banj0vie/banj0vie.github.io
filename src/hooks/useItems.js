import { useState, useEffect, useMemo } from 'react';
import { useContracts } from './useContracts';
import { useWeb3 } from '../contexts/Web3Context';
import { ID_SEEDS, ID_PRODUCE_ITEMS, ID_BAIT_ITEMS, ID_FISH_ITEMS, ID_CHEST_ITEMS, ID_POTION_ITEMS } from '../constants/app_ids';
import { ALL_ITEMS } from '../constants/item_data';

export const useItems = () => {
  const { contracts, isReady } = useContracts();
  const { account } = useWeb3();
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
      if (!contracts.items_1155 || !account || !isReady) {
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
        const balances = await contracts.items_1155.balanceOfBatch(addresses, itemIdStrings);
                
        // Filter out items with zero balance and map to item objects
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
        console.error('Failed to fetch items:', err);
        setError(err.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [contracts.items_1155, account, isReady, allItemIds]);

  // Filter items by category and return as JSON object
  const itemsByCategory = {
    seeds: items.filter(item => item.category === 'SEED'),
    productions: items.filter(item => item.category === 'PRODUCE'),
    baits: items.filter(item => item.category === 'BAIT'),
    fish: items.filter(item => item.category === 'FISH'),
    chests: items.filter(item => item.category === 'CHEST'),
    potions: items.filter(item => item.category === 'POTION'),
  };

  return {
    ...itemsByCategory, // Spread category objects
    all: items, // All items combined
    loading,
    error,
    refetch: () => {
      if (contracts.items_1155 && account && isReady) {
        const fetchItems = async () => {
          setLoading(true);
          setError(null);

          try {
            const addresses = new Array(allItemIds.length).fill(account);
            const itemIdStrings = allItemIds.map(id => id.toString());
            const balances = await contracts.items_1155.balanceOfBatch(addresses, itemIdStrings);
            
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
