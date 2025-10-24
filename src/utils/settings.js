// Settings storage key
export const SETTINGS_STORAGE_KEY = 'cryptoValley_settings';

// Default settings
export const defaultSettings = {
  soundVolume: 50,
  musicVolume: 50,
  isShowGrowthStage: false,
  isOverwritePlant: false,
  dexSlippage: 0.5,
  baseGwei: 0.5
};

// Load settings from localStorage
export const loadSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
};

// Save settings to localStorage
export const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

// Get a specific setting by key
export const getSetting = (key) => {
  const settings = loadSettings();
  return settings[key];
};

