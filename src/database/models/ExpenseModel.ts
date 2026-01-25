import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export default class ExpenseModel extends Model {
  static table = 'expenses';

  @field('amount') amount!: number;
  @text('category') category!: string;
  @text('description') description!: string;
  @date('spent_at') spentAt!: Date;
  
  @text('sync_status') syncStatus!: 'synced' | 'pending' | 'updated' | 'deleted';
  @text('server_id') serverId!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
