import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@security_settings';

export type SecuritySettings = {
  twoFA: boolean;
  darkMode: boolean;
  biometric: boolean;
};

const DEFAULT_SETTINGS: SecuritySettings = {
  twoFA: false,
  darkMode: false,
  biometric: false,
};

export const getSecuritySettings = async (): Promise<SecuritySettings> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SecuritySettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSecuritySettings = async (settings: SecuritySettings) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const resetSecuritySettings = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return DEFAULT_SETTINGS;
};
