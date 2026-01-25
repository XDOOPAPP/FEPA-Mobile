import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'expenses',
      columns: [
        { name: 'amount', type: 'number' },
        { name: 'category', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'spent_at', type: 'number' }, // Timestamp
        { name: 'sync_status', type: 'string' }, // 'synced', 'pending', 'updated', 'deleted'
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'budgets',
      columns: [
        { name: 'amount', type: 'number' },
        { name: 'category', type: 'string' },
        { name: 'month', type: 'string' }, // 'YYYY-MM'
        { name: 'sync_status', type: 'string' },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
