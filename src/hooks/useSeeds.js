import { useState, useEffect, useMemo } from 'react';
import { useContracts } from './useContracts';
import { useWeb3 } from '../contexts/Web3Context';
import { ID_SEEDS } from '../constants/app_ids';
import { ALL_ITEMS } from '../constants/item_all';

export const useSeeds = () => {
  const { contracts, isReady } = useContracts();
  const { account } = useWeb3();
  const [seeds, setSeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all seed IDs from constants - memoize to prevent infinite loops
  const seedIds = useMemo(() => Object.values(ID_SEEDS), []);

  useEffect(() => {
    const fetchSeeds = async () => {
      if (!contracts.items_1155 || !account || !isReady) {
        setSeeds([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Create array of user addresses (same address for all seeds)
        const addresses = new Array(seedIds.length).fill(account);
        
        // Convert seed IDs to strings for the contract call
        const seedIdStrings = seedIds.map(id => id.toString());
        
        console.log('Fetching seeds for account:', account);
        console.log('Seed IDs:', seedIdStrings.slice(0, 5), '... (showing first 5)');
        
        // Fetch balances for all seeds at once
        const balances = await contracts.items_1155.balanceOfBatch(addresses, seedIdStrings);
        
        console.log('Balances received:', balances.slice(0, 5), '... (showing first 5)');
        
        // Filter out seeds with zero balance and map to seed objects
        const userSeeds = [];
        balances.forEach((balance, index) => {
          // Convert balance to number for comparison
          const balanceNum = typeof balance === 'object' && balance.toNumber ? balance.toNumber() : Number(balance);
          if (balanceNum > 0) {
            const seedId = seedIds[index];
            const seedData = ALL_ITEMS[seedId];
            if (seedData) {
              userSeeds.push({
                id: seedId,
                count: balanceNum,
                ...seedData
              });
            }
          }
        });

        console.log('User seeds found:', userSeeds.length, userSeeds);
        setSeeds(userSeeds);
      } catch (err) {
        console.error('Failed to fetch seeds:', err);
        setError(err.message);
        setSeeds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSeeds();
  }, [contracts.items_1155, account, isReady, seedIds]);

  return {
    seeds,
    loading,
    error,
    refetch: () => {
      if (contracts.items_1155 && account && isReady) {
        const fetchSeeds = async () => {
          setLoading(true);
          setError(null);

          try {
            const addresses = new Array(seedIds.length).fill(account);
            const seedIdStrings = seedIds.map(id => id.toString());
            const balances = await contracts.items_1155.balanceOfBatch(addresses, seedIdStrings);
            
            const userSeeds = [];
            balances.forEach((balance, index) => {
              // Convert balance to number for comparison
              const balanceNum = typeof balance === 'object' && balance.toNumber ? balance.toNumber() : Number(balance);
              if (balanceNum > 0) {
                const seedId = seedIds[index];
                const seedData = ALL_ITEMS[seedId];
                if (seedData) {
                  userSeeds.push({
                    id: seedId,
                    count: balanceNum,
                    ...seedData
                  });
                }
              }
            });

            setSeeds(userSeeds);
          } catch (err) {
            console.error('Failed to refetch seeds:', err);
            setError(err.message);
          } finally {
            setLoading(false);
          }
        };
        fetchSeeds();
      }
    }
  };
};
