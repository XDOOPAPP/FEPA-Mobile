import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@profile_extras';

export type ProfileExtras = {
  age?: string;
  gender?: 'male' | 'female' | 'other';
  income?: string;
  location?: string;
};

export const getProfileExtras = async (): Promise<ProfileExtras> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProfileExtras) : {};
  } catch {
    return {};
  }
};

export const saveProfileExtras = async (extras: ProfileExtras) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(extras));
};
