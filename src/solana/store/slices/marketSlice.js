import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  listings: [],
  myListings: [],
  nextListingId: 1,
  loading: false,
  error: null,
  subscriptionIds: [],
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    fetchMarketDataStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchMarketDataSuccess: (state, action) => {
      state.listings = action.payload.listings;
      state.myListings = action.payload.myListings;
      state.nextListingId = action.payload.nextListingId;
      state.loading = false;
      state.error = null;
    },
    fetchMarketDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    createListing: (state, action) => {
      const listing = {
        listingId: Number(action.payload.listingId),
        seller: action.payload.seller,
        itemId: action.payload.itemId,
        amount: Number(action.payload.amount),
        pricePer: Number(action.payload.pricePer),
        active: true,
      };
      state.listings.push(listing);
      state.myListings.push(listing);
      state.nextListingId = action.payload.listingId + 1;
    },
    purchaseFromListing: (state, action) => {
      const { listingId, amount } = action.payload;
      const listing = state.listings.find(l => l.listingId === listingId);
      if (listing) {
        const remainingAmount = Math.max(0, Number(listing.amount) - Number(amount));
        if (remainingAmount === 0) {
          listing.active = false;
          state.listings = state.listings.filter(l => l.listingId !== listingId);
          state.myListings = state.myListings.filter(l => l.listingId !== listingId);
        } else {
          listing.amount = remainingAmount;
        }
      }
    },
    cancelListing: (state, action) => {
      const listingId = action.payload;
      const listing = state.listings.find(l => l.listingId === listingId);
      if (listing) listing.active = false;
      state.listings = state.listings.filter(l => l.listingId !== listingId);
      state.myListings = state.myListings.filter(l => l.listingId !== listingId);
    },
    updateListingStatus: (state, action) => {
      const { listingId, active } = action.payload;
      const listing = state.listings.find(l => l.listingId === listingId);
      if (listing) {
        listing.active = active;
        if (!active) {
          state.listings = state.listings.filter(l => l.listingId !== listingId);
          state.myListings = state.myListings.filter(l => l.listingId !== listingId);
        }
      }
    },
    subscribeToMarket: (state, action) => {
      state.subscriptionIds = action.payload;
    },
    unsubscribeFromMarket: (state) => {
      state.subscriptionIds = [];
    },
    clearMarketData: (state) => {
      state.listings = [];
      state.myListings = [];
      state.nextListingId = 1;
      state.subscriptionIds = [];
      state.error = null;
    },
    updateNextListingId: (state, action) => {
      state.nextListingId = action.payload;
    },
  },
});

export const {
  fetchMarketDataStart,
  fetchMarketDataSuccess,
  fetchMarketDataFailure,
  createListing,
  purchaseFromListing,
  cancelListing,
  updateListingStatus,
  subscribeToMarket,
  unsubscribeFromMarket,
  clearMarketData,
  updateNextListingId,
} = marketSlice.actions;

export default marketSlice.reducer;

export const selectListingsByItem = (state, itemId) =>
  state.market.listings.filter(l => l.itemId === itemId && l.active);
export const selectMyActiveListings = (state) =>
  state.market.myListings.filter(l => l.active);
export const selectListingsBySeller = (state, seller) =>
  state.market.listings.filter(l => String(l.seller) === seller && l.active);
