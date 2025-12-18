// Cấu hình SQLite cho Offline mode
// Ensure you have installed react-native-sqlite-storage
// npm install react-native-sqlite-storage

import { enablePromise, openDatabase } from 'react-native-sqlite-storage';

enablePromise(true);

export const getDBConnection = async () => {
  return openDatabase({ name: 'fepa-mobile.db', location: 'default' });
};
