import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Sage data from useSage hook
  lockedAmount: 0,
  lastUnlockTime: 0,
  lastUnlockTimeHarvest: 0,
  unlockRate: 0,
  unlockAmount: 0,
  canUnlockWage: false,
  canUnlockHarvest: false,
  nextUnlockTime: 0,
  nextWageUnlockTime: 0,
  nextHarvestUnlockTime: 0,
  harvestUnlockPercent: 0,
  harvestUnlockAmount: 0,
  weeklyWageAmount: 0,
  
  // UI state
  loading: false,
  error: null,
  
  // Timer states
  wageTimer: 0,
  harvestTimer: 0,
  
  // Transaction states
  isUnlockingWage: false,
  isUnlockingHarvest: false,
};

const sageSlice = createSlice({
  name: 'sage',
  initialState,
  reducers: {
    // Data fetching actions
    fetchSageDataStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSageDataSuccess: (state, action) => {
      const {
        lockedAmount,
        lastUnlockTime,
        lastUnlockTimeHarvest,
        unlockRate,
        unlockAmount,
        canUnlockWage,
        canUnlockHarvest,
        nextUnlockTime,
        nextWageUnlockTime,
        nextHarvestUnlockTime,
        harvestUnlockPercent,
        harvestUnlockAmount,
        weeklyWageAmount,
      } = action.payload;
      
      state.lockedAmount = lockedAmount;
      state.lastUnlockTime = lastUnlockTime;
      state.lastUnlockTimeHarvest = lastUnlockTimeHarvest;
      state.unlockRate = unlockRate;
      state.unlockAmount = unlockAmount;
      state.canUnlockWage = canUnlockWage;
      state.canUnlockHarvest = canUnlockHarvest;
      state.nextUnlockTime = nextUnlockTime;
      state.nextWageUnlockTime = nextWageUnlockTime;
      state.nextHarvestUnlockTime = nextHarvestUnlockTime;
      state.harvestUnlockPercent = harvestUnlockPercent;
      state.harvestUnlockAmount = harvestUnlockAmount;
      state.weeklyWageAmount = weeklyWageAmount;
      state.loading = false;
      state.error = null;
    },
    fetchSageDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    // Weekly Wage actions
    unlockWeeklyWageStart: (state) => {
      state.isUnlockingWage = true;
      state.error = null;
    },
    unlockWeeklyWageSuccess: (state) => {
      state.isUnlockingWage = false;
      state.canUnlockWage = false;
      state.lastUnlockTime = Date.now() / 1000;
      state.nextWageUnlockTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
    },
    unlockWeeklyWageFailure: (state, action) => {
      state.isUnlockingWage = false;
      state.error = action.payload;
    },
    
    // Weekly Harvest actions
    unlockWeeklyHarvestStart: (state) => {
      state.isUnlockingHarvest = true;
      state.error = null;
    },
    unlockWeeklyHarvestSuccess: (state) => {
      state.isUnlockingHarvest = false;
      state.canUnlockHarvest = false;
      state.lastUnlockTimeHarvest = Date.now() / 1000;
      state.nextHarvestUnlockTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
      // Reduce locked amount by the amount unlocked
      state.lockedAmount = Math.max(0, state.lockedAmount - state.harvestUnlockAmount);
    },
    unlockWeeklyHarvestFailure: (state, action) => {
      state.isUnlockingHarvest = false;
      state.error = action.payload;
    },
    
    // Timer updates
    updateWageTimer: (state, action) => {
      state.wageTimer = action.payload;
    },
    updateHarvestTimer: (state, action) => {
      state.harvestTimer = action.payload;
    },
    
    // State updates for unlock availability
    updateUnlockAvailability: (state, action) => {
      const { canUnlockWage, canUnlockHarvest } = action.payload;
      state.canUnlockWage = canUnlockWage;
      state.canUnlockHarvest = canUnlockHarvest;
    },
    
    // Clear sage data (for logout/disconnect)
    clearSageData: (state) => {
      Object.assign(state, initialState);
    },
    
    // Reset error state
    clearSageError: (state) => {
      state.error = null;
    },
    
    // Update specific sage data fields
    updateSageField: (state, action) => {
      const { field, value } = action.payload;
      if (field in state) {
        state[field] = value;
      }
    },
  },
});

export const {
  fetchSageDataStart,
  fetchSageDataSuccess,
  fetchSageDataFailure,
  unlockWeeklyWageStart,
  unlockWeeklyWageSuccess,
  unlockWeeklyWageFailure,
  unlockWeeklyHarvestStart,
  unlockWeeklyHarvestSuccess,
  unlockWeeklyHarvestFailure,
  updateWageTimer,
  updateHarvestTimer,
  updateUnlockAvailability,
  clearSageData,
  clearSageError,
  updateSageField,
} = sageSlice.actions;

// Selectors
export const selectSageData = (state) => state.sage;
export const selectSageLoading = (state) => state.sage.loading;
export const selectSageError = (state) => state.sage.error;
export const selectCanUnlockWage = (state) => state.sage.canUnlockWage;
export const selectCanUnlockHarvest = (state) => state.sage.canUnlockHarvest;
export const selectLockedAmount = (state) => state.sage.lockedAmount;
export const selectWeeklyWageAmount = (state) => state.sage.weeklyWageAmount;
export const selectHarvestUnlockAmount = (state) => state.sage.harvestUnlockAmount;
export const selectHarvestUnlockPercent = (state) => state.sage.harvestUnlockPercent;
export const selectWageTimer = (state) => state.sage.wageTimer;
export const selectHarvestTimer = (state) => state.sage.harvestTimer;
export const selectIsUnlockingWage = (state) => state.sage.isUnlockingWage;
export const selectIsUnlockingHarvest = (state) => state.sage.isUnlockingHarvest;

export default sageSlice.reducer;
