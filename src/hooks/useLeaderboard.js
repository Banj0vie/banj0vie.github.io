import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from './useProgram';
import { useSolanaWallet } from './useSolanaWallet';
import { getGameRegistryPDA, getEpochTop5PDA, getUserDataPDA } from '../solana/utils/pdaUtils';
import {
  fetchLeaderboardStart,
  fetchLeaderboardSuccess,
  fetchLeaderboardFailure,
  setSelectedEpoch,
  selectLeaderboardItems,
  selectLeaderboardUserScore,
  selectLeaderboardCurrentEpoch,
  selectLeaderboardEpochStart,
  selectLeaderboardSelectedEpoch,
  selectLeaderboardLoading,
} from '../solana/store/slices/leaderboardSlice';

function shortPk(pk) {
  const s = typeof pk === 'string' ? pk : new PublicKey(pk).toBase58();
  return s.slice(0, 4) + '…' + s.slice(-4);
}

export const useLeaderboard = () => {
  const { publicKey } = useSolanaWallet();
  const programApi = useProgram();
  const program = programApi.getProgram();
  const dispatch = useDispatch();

  const leaderboardData = useSelector(selectLeaderboardItems);
  const userScore = useSelector(selectLeaderboardUserScore);
  const currentEpoch = useSelector(selectLeaderboardCurrentEpoch);
  const epochStart = useSelector(selectLeaderboardEpochStart);
  const selectedEpoch = useSelector(selectLeaderboardSelectedEpoch);
  const loading = useSelector(selectLeaderboardLoading);

  const fetchLeaderboardData = useCallback(async (epochParam) => {
    if (!program) return;
    dispatch(fetchLeaderboardStart());
    try {
      const gameRegistryPda = getGameRegistryPDA();
      const reg = await program.account.gameRegistry.fetch(gameRegistryPda);
      const currentEpochFromRegistry = Number(reg.epoch);
      const epoch = epochParam ?? currentEpochFromRegistry;
      const start = Number(reg.epochStart);

      let items = [];
      try {
        const epochTop5Pda = getEpochTop5PDA(epoch);
        const hist = await program.account.epochTop5History.fetch(epochTop5Pda);
        console.log("🚀 ~ useLeaderboard ~ hist:", hist)
        
        // Extract names and scores
        const names = [hist.name1, hist.name2, hist.name3, hist.name4, hist.name5];
        const xps = hist.top5Xp || [];
        
        console.log('Raw names data:', names);
        console.log('Raw xps data:', xps);
        
        items = names.map((nameByteArray, i) => {
          // Convert byte array to string, removing null bytes
          const nameStr = new TextDecoder('utf-8').decode(new Uint8Array(nameByteArray)).replace(/\0/g, '');
          const score = Number(xps[i] || 0);
          
          console.log(`Player ${i + 1}: name="${nameStr}", score=${score}`);
          
          return {
            rank: i + 1,
            name: nameStr || "Anonymous",
            score: score,
          };
        });
        
        console.log('Final leaderboard items:', items);
      } catch (e) {
        console.log('No history for epoch', epoch, 'error:', e);
        // No history for this epoch yet
        items = [];
      }

      // Compute current user's score from their userData PDA
      let myScore = 0;
      if (publicKey) {
        try {
          const myPda = getUserDataPDA(publicKey);
          const meUd = await program.account.userData.fetch(myPda);
          const lastCounted = Number(meUd.lastEpochCounted ?? meUd.last_epoch_counted ?? 0);
          const epochXp = Number(meUd.epochXp ?? meUd.epoch_xp ?? 0);
          const totalXp = Number(meUd.xp ?? 0);
          
          console.log('User data for score calculation:', {
            publicKey: publicKey.toString(),
            lastCounted,
            epochXp,
            totalXp,
            viewingEpoch: epoch,
            lastCountedMatchesEpoch: lastCounted === epoch
          });
          
          // Always show the user's epoch XP, regardless of whether they're in top 5
          myScore = epochXp;
          console.log('User score set to epochXp:', myScore, 'for epoch:', epoch);
          
          if (lastCounted !== epoch) {
            console.log('Note: lastCounted (', lastCounted, ') !== epoch (', epoch, '), but showing epochXp anyway');
          }
        } catch (e) {
          console.log('Error fetching user data for score:', e);
        }
      }

      dispatch(fetchLeaderboardSuccess({
        items,
        userScore: myScore,
        currentEpoch: currentEpochFromRegistry,
        epochStart: start,
        selectedEpoch: epoch,
      }));
    } catch (err) {
      dispatch(fetchLeaderboardFailure(err.message));
    }
  }, [program, publicKey, dispatch]);

  return {
    leaderboardData,
    userScore,
    epochStart,
    currentEpoch,
    selectedEpoch,
    loading,
    fetchLeaderboardData,
    setSelectedEpoch: (e) => dispatch(setSelectedEpoch(e)),
  };
};


