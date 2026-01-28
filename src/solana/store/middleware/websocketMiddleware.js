import { Connection, PublicKey } from '@solana/web3.js';
import { RPC_ENDPOINT } from '../../constants/programId';
import { getUserPDAs } from '../../utils/pdaUtils';

const wsState = {
  connections: new Map(),
  subscriptions: new Map(),
};

export const websocketMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  if (action.type === 'user/fetchUserDataSuccess') {
    const { userData } = action.payload || {};
    const sponsor = userData?.sponsor;
    if (sponsor && typeof sponsor === 'string') {
      try {
        const walletPublicKey = new PublicKey(sponsor);
        subscribeToUserAccounts(store, walletPublicKey);
      } catch {}
    }
  }

  if (action.type === 'user/clearUserData') {
    unsubscribeFromAllAccounts(store);
  }

  return result;
};

const subscribeToUserAccounts = (store, walletPublicKey) => {
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  try {
    const { userData: [userDataPDA], bankerData: [bankerDataPDA] } = getUserPDAs(walletPublicKey);
    const userDataSubscription = connection.onAccountChange(
      userDataPDA,
      (accountInfo) => {
        try {
          store.dispatch({ type: 'user/updateUserData', payload: parseUserDataAccount(accountInfo.data) });
        } catch {}
      },
      'confirmed'
    );
    const bankerDataSubscription = connection.onAccountChange(
      bankerDataPDA,
      (accountInfo) => {
        try {
          store.dispatch({ type: 'balance/updateStakedBalance', payload: parseBankerDataAccount(accountInfo.data) });
        } catch {}
      },
      'confirmed'
    );
    wsState.subscriptions.set('userData', userDataSubscription);
    wsState.subscriptions.set('bankerData', bankerDataSubscription);
  } catch {}
};

const unsubscribeFromAllAccounts = () => {
  wsState.subscriptions.clear();
};

const parseUserDataAccount = () => ({ name: 'User', level: 1, xp: 0 });
const parseBankerDataAccount = () => '0';
