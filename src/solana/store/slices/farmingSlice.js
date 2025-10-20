import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  crops: [],
  activePlotIds: [],
  maxPlots: 15,
  loading: false,
  error: null,
  subscriptionId: null,
};

const farmingSlice = createSlice({
  name: 'farming',
  initialState,
  reducers: {
    fetchFarmingDataStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchFarmingDataSuccess: (state, action) => {
      state.crops = action.payload.crops;
      state.activePlotIds = action.payload.activePlotIds;
      state.maxPlots = action.payload.maxPlots;
      state.loading = false;
      state.error = null;
    },
    fetchFarmingDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateFarmingData: (state, action) => {
      const { crops, activePlotIds, maxPlots } = action.payload || {};
      if (crops) state.crops = crops;
      if (activePlotIds) state.activePlotIds = activePlotIds;
      if (maxPlots) state.maxPlots = maxPlots;
    },
    plantSeeds: (state, action) => {
      const { seedIds, plotIds } = action.payload;
      seedIds.forEach((seedId, index) => {
        const plotId = plotIds[index];
        if (plotId < state.crops.length) {
          state.crops[plotId] = {
            id: seedId,
            endTime: Math.floor(Date.now() / 1000) + 3600,
            prodMultiplier: 1000,
            tokenMultiplier: 1000,
            growthElixir: 0,
          };
        }
      });
      state.activePlotIds = [...new Set([...state.activePlotIds, ...plotIds])];
    },
    harvestCrops: (state, action) => {
      const plotIds = action.payload;
      plotIds.forEach(plotId => {
        if (plotId < state.crops.length) {
          state.crops[plotId] = {
            id: 0,
            endTime: 0,
            prodMultiplier: 0,
            tokenMultiplier: 0,
            growthElixir: 0,
          };
        }
      });
      state.activePlotIds = state.activePlotIds.filter(id => !plotIds.includes(id));
    },
    applyGrowthElixir: (state, action) => {
      const plotId = action.payload;
      if (plotId < state.crops.length && state.crops[plotId]?.id !== 0) {
        state.crops[plotId].growthElixir = 1;
        state.crops[plotId].endTime = Math.floor(Date.now() / 1000) + 1800;
      }
    },
    applyPesticide: (state, action) => {
      const plotId = action.payload;
      if (plotId < state.crops.length && state.crops[plotId]?.id !== 0) {
        state.crops[plotId].prodMultiplier = Math.min((state.crops[plotId].prodMultiplier || 0) + 500, 2000);
      }
    },
    applyFertilizer: (state, action) => {
      const plotId = action.payload;
      if (plotId < state.crops.length && state.crops[plotId]?.id !== 0) {
        state.crops[plotId].tokenMultiplier = Math.min((state.crops[plotId].tokenMultiplier || 0) + 500, 2000);
      }
    },
    subscribeToFarming: (state, action) => {
      state.subscriptionId = action.payload;
    },
    unsubscribeFromFarming: (state) => {
      state.subscriptionId = null;
    },
    clearFarmingData: (state) => {
      state.crops = [];
      state.activePlotIds = [];
      state.maxPlots = 15;
      state.subscriptionId = null;
      state.error = null;
    },
    updateMaxPlots: (state, action) => {
      state.maxPlots = action.payload;
    },
  },
});

export const {
  fetchFarmingDataStart,
  fetchFarmingDataSuccess,
  fetchFarmingDataFailure,
  updateFarmingData,
  plantSeeds,
  harvestCrops,
  applyGrowthElixir,
  applyPesticide,
  applyFertilizer,
  subscribeToFarming,
  unsubscribeFromFarming,
  clearFarmingData,
  updateMaxPlots,
} = farmingSlice.actions;

export default farmingSlice.reducer;

export const selectReadyCrops = (state) => {
  const now = Math.floor(Date.now() / 1000);
  return state.farming.crops
    .map((crop, index) => ({ ...crop, plotIndex: index }))
    .filter((crop) => crop.id !== 0 && crop.endTime <= now);
};
