import { createSlice } from '@reduxjs/toolkit';
import { BN } from 'bn.js';
import { ID_ITEM_CATEGORIES, ID_LOOT_CATEGORIES } from '../../../constants/app_ids';

const initialState = {
  items: {},
  loading: false,
  error: null,
  subscriptionIds: [],
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    fetchInventoryStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchInventorySuccess: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchInventoryFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateItemBalance: (state, action) => {
      const { itemId, balance } = action.payload;
      state.items[itemId] = balance;
    },
    updateItemBalances: (state, action) => {
      state.items = { ...state.items, ...action.payload };
    },
    setAllItems: (state, action) => {
      state.items = action.payload || {};
    },
    addItems: (state, action) => {
      const { items } = action.payload;
      Object.entries(items).forEach(([itemId, amount]) => {
        const id = parseInt(itemId);
        const currentBalance = new BN(state.items[id] || '0');
        const addedAmount = new BN(amount);
        state.items[id] = currentBalance.add(addedAmount).toString();
      });
    },
    removeItems: (state, action) => {
      const { items } = action.payload;
      Object.entries(items).forEach(([itemId, amount]) => {
        const id = parseInt(itemId);
        const currentBalance = new BN(state.items[id] || '0');
        const removedAmount = new BN(amount);
        const newBalance = currentBalance.sub(removedAmount);
        state.items[id] = newBalance.isNeg() ? '0' : newBalance.toString();
      });
    },
    transferItems: (state, action) => {
      const { fromItems, toItems } = action.payload;
      
      Object.entries(fromItems).forEach(([itemId, amount]) => {
        const id = parseInt(itemId);
        const currentBalance = new BN(state.items[id] || '0');
        const removedAmount = new BN(amount);
        const newBalance = currentBalance.sub(removedAmount);
        state.items[id] = newBalance.isNeg() ? '0' : newBalance.toString();
      });

      Object.entries(toItems).forEach(([itemId, amount]) => {
        const id = parseInt(itemId);
        const currentBalance = new BN(state.items[id] || '0');
        const addedAmount = new BN(amount);
        state.items[id] = currentBalance.add(addedAmount).toString();
      });
    },
    subscribeToInventory: (state, action) => {
      state.subscriptionIds = action.payload;
    },
    unsubscribeFromInventory: (state) => {
      state.subscriptionIds = [];
    },
    clearInventory: (state) => {
      state.items = {};
      state.subscriptionIds = [];
      state.error = null;
    },
  },
});

export const {
  fetchInventoryStart,
  fetchInventorySuccess,
  fetchInventoryFailure,
  updateItemBalance,
  updateItemBalances,
  setAllItems,
  addItems,
  removeItems,
  transferItems,
  subscribeToInventory,
  unsubscribeFromInventory,
  clearInventory,
} = inventorySlice.actions;

export default inventorySlice.reducer;

export const selectItemBalance = (state, itemId) => state.inventory.items[itemId] || '0';
export const selectAllItemsArray = (state) => {
  return Object.entries(state.inventory.items).map(([idStr, count]) => {
    const id = Number(idStr);
    const categoryNum = id >> 8;
    let category = ID_ITEM_CATEGORIES.SEED;
    let subCategory = undefined;
    if (categoryNum >= 5 && categoryNum <= 7) category = ID_ITEM_CATEGORIES.PRODUCE;
    else if (categoryNum === 8) { category = ID_ITEM_CATEGORIES.LOOT; subCategory = ID_LOOT_CATEGORIES.BAIT; }
    else if (categoryNum === 9) { category = ID_ITEM_CATEGORIES.LOOT; subCategory = ID_LOOT_CATEGORIES.FISH; }
    else if (categoryNum === 10) { category = ID_ITEM_CATEGORIES.LOOT; subCategory = ID_LOOT_CATEGORIES.CHEST; }
    else if (categoryNum === 11) category = ID_ITEM_CATEGORIES.POTION;

    return { id, count: Number(count), category, subCategory };
  });
};
export const selectHasEnoughItems = (state, requiredItems) => {
  return Object.entries(requiredItems).every(([itemId, amount]) => {
    const id = parseInt(itemId);
    const currentBalance = new BN(state.inventory.items[id] || '0');
    const requiredAmount = new BN(amount);
    return currentBalance.gte(requiredAmount);
  });
};
export const selectTotalItemCount = (state) => {
  return Object.values(state.inventory.items).reduce((total, balance) => {
    return total.add(new BN(balance));
  }, new BN(0)).toString();
};
export const selectItemsByCategory = (state, category) => {
  return Object.entries(state.inventory.items)
    .filter(([itemId]) => {
      return parseInt(itemId) >= category * 1000 && parseInt(itemId) < (category + 1) * 1000;
    })
    .reduce((acc, [itemId, balance]) => {
      acc[parseInt(itemId)] = balance;
      return acc;
    }, {});
};
