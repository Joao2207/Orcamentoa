
import Dexie from 'dexie';
import type { Table } from 'dexie';
import { Customer, Product, Quote, CompanySettings, Order, Category } from '../types';

export class AppDatabase extends Dexie {
  customers!: Table<Customer>;
  products!: Table<Product>;
  quotes!: Table<Quote>;
  settings!: Table<CompanySettings>;
  orders!: Table<Order>;
  categories!: Table<Category>;

  constructor() {
    super('BudgetAppDB');
    
    // Fix: Accessing versioning on the class instance correctly
    this.version(3).stores({
      customers: '++id, name, birthday',
      products: '++id, name, categoryId, active',
      quotes: '++id, customerId, date, status',
      settings: '++id',
      orders: '++id, customerId, deliveryDate, status',
      categories: '++id, name'
    });
  }
}

export const db = new AppDatabase();
