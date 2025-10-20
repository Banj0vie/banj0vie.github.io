import { Connection, PublicKey } from '@solana/web3.js';
import { RPC_ENDPOINT } from '../../constants/programId';
import { getUserPDAs, getMarketPDAs } from '../../utils/pdaUtils';
import { TOKEN_PROGRAM_ID } from '../../utils/accountUtils';

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

const subscribeToTokenAccounts = (store, walletPublicKey) => {
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  connection.getTokenAccountsByOwner(walletPublicKey, {
    programId: TOKEN_PROGRAM_ID,
  }).then((response) => {
    response.value.forEach((tokenAccount) => {
      const subscription = connection.onAccountChange(
        tokenAccount.pubkey,
        (accountInfo) => {
          try {
            const balance = parseTokenAccountBalance(accountInfo.data);
            store.dispatch({
              type: 'balance/updateGameTokenBalance',
              payload: balance,
            });
          } catch (error) {
            console.error('Error parsing token account:', error);
          }
        },
        'confirmed'
      );
      wsState.subscriptions.set(`token_${tokenAccount.pubkey.toString()}`, subscription);
    });
  }).catch((error) => {
    console.error('Error getting token accounts:', error);
  });
};

const subscribeToMarketAccounts = (store) => {
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const { marketData: [marketDataPDA] } = getMarketPDAs();

  const marketDataSubscription = connection.onAccountChange(
    marketDataPDA,
    (accountInfo) => {
      try {
        store.dispatch({
          type: 'market/updateNextListingId',
          payload: parseMarketDataAccount(accountInfo.data),
        });
      } catch (error) {
        console.error('Error parsing market data account:', error);
      }
    },
    'confirmed'
  );

  wsState.subscriptions.set('marketData', marketDataSubscription);
};

const unsubscribeFromAllAccounts = () => {
  wsState.subscriptions.clear();
};

const parseUserDataAccount = () => ({ name: 'User', level: 1, xp: 0 });
const parseBankerDataAccount = () => '0';
const parseTokenAccountBalance = (data) => {
  return '0';
};
const parseMarketDataAccount = () => 1;
