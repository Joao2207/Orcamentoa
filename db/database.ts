// Use named import for Dexie to ensure that the class definition is correctly resolved as the base class, making instance methods like 'version' available on 'this'.
import { Dexie, type Table } from 'dexie';
import { Customer, Product, Quote, CompanySettings, Order, Category, CalendarNote } from '../types';

export class AppDatabase extends Dexie {
  customers!: Table<Customer>;
  products!: Table<Product>;
  quotes!: Table<Quote>;
  settings!: Table<CompanySettings>;
  orders!: Table<Order>;
  categories!: Table<Category>;
  calendarNotes!: Table<CalendarNote>;

  constructor() {
    super('BudgetAppDB');
    
    // Using this.version() is standard for Dexie instances within the constructor.
    // Named import 'Dexie' is used to ensure all Dexie prototype methods are correctly available on 'this' and recognized by TypeScript.
    this.version(4).stores({
      customers: '++id, name, birthday',
      products: '++id, name, categoryId, active',
      quotes: '++id, customerId, date, status, deliveryDate',
      settings: '++id',
      orders: '++id, customerId, deliveryDate, status',
      categories: '++id, name',
      calendarNotes: '++id, date'
    });
  }
}

export const db = new AppDatabase();
