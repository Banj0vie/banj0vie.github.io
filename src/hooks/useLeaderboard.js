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
      const epoch = epochParam ?? Number(reg.epoch);
      const start = Number(reg.epochStart);

      let items = [];
      try {
        const epochTop5Pda = getEpochTop5PDA(epoch);
        const hist = await program.account.epochTop5History.fetch(epochTop5Pda);
        const names = [hist.name1, hist.name2, hist.name3, hist.name4, hist.name5];
        const xps = hist.top5Xp || hist.top5_xp || [];
        items = names.map((nameByteArray, i) => {
          // Convert byte array to string, removing null bytes
          const nameStr = new TextDecoder('utf-8').decode(nameByteArray).replace(/\0/g, '');
          return {
            rank: i + 1,
            name: nameStr || "Anonymous",
            score: Number(xps[i] || 0),
          };
        });
      } catch (e) {
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
          if (lastCounted === epoch) {
            myScore = epochXp;
          }
          // Names are now stored directly in the leaderboard data
        } catch {
          // ignore userData fetch errors
        }
      }

      dispatch(fetchLeaderboardSuccess({
        items,
        userScore: myScore,
        currentEpoch: epoch,
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


