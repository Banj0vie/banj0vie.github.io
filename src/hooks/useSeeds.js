import { useState, useEffect, useMemo } from 'react';
import { useAgwEthersAndService } from '../hooks/useAgwEthersAndService';
import { ID_SEEDS, ID_PRODUCE_ITEMS, ID_BAIT_ITEMS, ID_FISH_ITEMS, ID_CHEST_ITEMS, ID_POTION_ITEMS } from '../constants/app_ids';
import { ALL_ITEMS } from '../constants/item_data';

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
        
        console.log('Fetching items for account:', account);
        console.log('Item IDs:', itemIdStrings.slice(0, 5), '... (showing first 5)');
        
        // Fetch balances for all items at once
        const balances = await publicClient.readContract({
          address: items1155.address,
          abi: items1155.abi,
          functionName: 'balanceOfBatch',
          args: [addresses, itemIdStrings],
        });
        
        console.log('Balances received:', balances.slice(0, 5), '... (showing first 5)');
        
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

        console.log('User items found:', userItems.length, userItems);
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
