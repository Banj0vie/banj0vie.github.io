import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeDialog: null,
  notifications: [],
  isTransactionPending: false,
  loadingStates: {},
  errorStates: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openDialog: (state, action) => {
      state.activeDialog = action.payload;
    },
    closeDialog: (state) => {
      state.activeDialog = null;
    },
    addNotification: (state, action) => {
      const { type, message, duration = 5000 } = action.payload;
      const notification = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: Date.now(),
        duration,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      const id = action.payload;
      state.notifications = state.notifications.filter(n => n.id !== id);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setTransactionPending: (state, action) => {
      state.isTransactionPending = action.payload;
    },
    setLoading: (state, action) => {
      const { key, loading } = action.payload;
      state.loadingStates[key] = loading;
    },
    clearLoading: (state, action) => {
      const key = action.payload;
      delete state.loadingStates[key];
    },
    clearAllLoading: (state) => {
      state.loadingStates = {};
    },
    setError: (state, action) => {
      const { key, error } = action.payload;
      state.errorStates[key] = error;
    },
    clearError: (state, action) => {
      const key = action.payload;
      delete state.errorStates[key];
    },
    clearAllErrors: (state) => {
      state.errorStates = {};
    },
    clearUIState: (state) => {
      state.activeDialog = null;
      state.notifications = [];
      state.isTransactionPending = false;
      state.loadingStates = {};
      state.errorStates = {};
    },
  },
});

export const {
  openDialog,
  closeDialog,
  addNotification,
  removeNotification,
  clearNotifications,
  setTransactionPending,
  setLoading,
  clearLoading,
  clearAllLoading,
  setError,
  clearError,
  clearAllErrors,
  clearUIState,
} = uiSlice.actions;

export default uiSlice.reducer;

export const selectLoadingState = (state, key) => state.ui.loadingStates[key] || false;
export const selectErrorState = (state, key) => state.ui.errorStates[key] || null;
export const selectHasActiveDialog = (state) => state.ui.activeDialog !== null;
export const selectActiveNotifications = (state) => state.ui.notifications;
export const selectNotificationsByType = (state, type) =>
  state.ui.notifications.filter(n => n.type === type);
