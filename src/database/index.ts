import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { mySchema } from './schema';
import ExpenseModel from './models/ExpenseModel';
// import BudgetModel from './models/BudgetModel'; // Will create later

const adapter = new SQLiteAdapter({
  schema: mySchema,
  // (You might want to comment out migration events for now)
  // migrations, 
  jsi: true, // Enable JSI for faster database operations
  onSetUpError: error => {
    // Database failed to load -- offer the user to reload the app or log out
  }
});

export const database = new Database({
  adapter,
  modelClasses: [
    ExpenseModel,
    // BudgetModel,
  ],
});
