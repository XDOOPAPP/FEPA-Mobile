import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@receipts';

export type ReceiptItem = {
  id: string;
  expenseId: string;
  uri: string;
  amount?: number;
  category?: string;
  createdAt: string;
};

type ReceiptStore = Record<string, ReceiptItem>;

const getStore = async (): Promise<ReceiptStore> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReceiptStore) : {};
  } catch {
    return {};
  }
};

const saveStore = async (store: ReceiptStore) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const saveReceipt = async (item: ReceiptItem) => {
  const store = await getStore();
  store[item.id] = item;
  await saveStore(store);
};

export const getReceipts = async (): Promise<ReceiptItem[]> => {
  const store = await getStore();
  return Object.values(store).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const deleteReceipt = async (id: string) => {
  const store = await getStore();
  if (store[id]) {
    delete store[id];
    await saveStore(store);
  }
};
