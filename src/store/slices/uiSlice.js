import { createSlice } from '@reduxjs/toolkit';
import { loadSettings, saveSettings, defaultSettings } from '../../utils/settings';

const initialState = {
  settings: loadSettings() || defaultSettings,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    updateSetting: (state, action) => {
      const { key, value } = action.payload;
      state.settings[key] = value;
      saveSettings(state.settings);
    },
    setSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
      saveSettings(state.settings);
    },
  },
});

export const { updateSetting, setSettings } = uiSlice.actions;
export const selectSettings = (state) => state.ui.settings;
export default uiSlice.reducer;
