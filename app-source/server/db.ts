import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Business,
  User,
  Category,
  Product,
  Inventory,
  InventoryLog,
  Shift,
  Transaction,
  TransactionItem,
  Payment,
  Expense,
  AuditLog,
} from './types';

export interface DatabaseState {
  businesses: Business[];
  users: User[];
  categories: Category[];
  products: Product[];
  inventory: Inventory[];
  inventory_logs: InventoryLog[];
  shifts: Shift[];
  transactions: Transaction[];
  transaction_items: TransactionItem[];
  payments: Payment[];
  expenses: Expense[];
  audit_logs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'rahaya_pos.json');
const SUPABASE_CONFIG_FILE = path.join(DATA_DIR, 'supabase_config.json');

class DatabaseEngine {
  private data: DatabaseState = {
    businesses: [],
    users: [],
    categories: [],
    products: [],
    inventory: [],
    inventory_logs: [],
    shifts: [],
    transactions: [],
    transaction_items: [],
    payments: [],
    expenses: [],
    audit_logs: [],
  };

  private supabase: SupabaseClient | null = null;
  private isLoaded = false;

  constructor() {
    this.initSupabase();
    this.loadFromDisk();
  }

  private initSupabase() {
    let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    let supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // Load from persistent file if env vars not populated
    if ((!supabaseUrl || !supabaseKey) && fs.existsSync(SUPABASE_CONFIG_FILE)) {
      try {
        const raw = fs.readFileSync(SUPABASE_CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.supabase_url && parsed.supabase_key) {
          supabaseUrl = parsed.supabase_url;
          supabaseKey = parsed.supabase_key;
          process.env.SUPABASE_URL = supabaseUrl;
          process.env.SUPABASE_ANON_KEY = supabaseKey;
        }
      } catch (err) {
        console.warn('[Database] Failed to read supabase_config.json:', err);
      }
    }

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('[Database] Supabase online PostgreSQL client initialized with Anon Key:', supabaseUrl);
      } catch (err) {
        console.error('[Database] Failed to init Supabase client:', err);
      }
    }
  }

  public getSupabaseClient(): SupabaseClient | null {
    return this.supabase;
  }

  public getSupabaseStatus(): { connected: boolean; url: string | null } {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;
    return {
      connected: !!this.supabase,
      url,
    };
  }

  public configureSupabase(url: string, anonKey: string): { success: boolean; message: string } {
    try {
      this.supabase = createClient(url, anonKey);
      process.env.SUPABASE_URL = url;
      process.env.SUPABASE_ANON_KEY = anonKey;

      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(
        SUPABASE_CONFIG_FILE,
        JSON.stringify(
          {
            supabase_url: url,
            supabase_key: anonKey,
            configured_at: new Date().toISOString(),
          },
          null,
          2
        )
      );

      return {
        success: true,
        message: 'Klien Supabase PostgreSQL online berhasil terhubung dan tersimpan secara permanen.',
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menginisialisasi klien Supabase' };
    }
  }

  public async testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
    if (!this.supabase) {
      return { connected: false, message: 'Klien Supabase belum terkonfigurasi. Masukkan URL dan Anon Key.' };
    }
    try {
      const { data, error } = await this.supabase.from('businesses').select('id').limit(1);
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          return {
            connected: true,
            message: 'Koneksi ke Supabase PostgreSQL berhasil! Tabel belum dibuat, silakan jalankan skema SQL pada tab Generator Skema SQL.',
          };
        }
        return { connected: false, message: `Koneksi Supabase aktif, namun query mengembalikan: ${error.message}` };
      }
      return { connected: true, message: 'Koneksi ke Supabase PostgreSQL online berhasil diverifikasi dan tabel siap digunakan!' };
    } catch (err: any) {
      return { connected: false, message: `Koneksi gagal: ${err.message}` };
    }
  }

  public async syncTransactionToSupabase(
    transaction: Transaction,
    items: TransactionItem[],
    payment: Payment
  ) {
    if (!this.supabase) return;
    try {
      await this.supabase.from('transactions').upsert({
        id: transaction.id,
        invoice_number: transaction.invoice_number,
        business_id: transaction.business_id,
        shift_id: transaction.shift_id,
        cashier_user_id: transaction.cashier_user_id,
        cashier_name: transaction.cashier_name,
        customer_name: transaction.customer_name,
        order_type: transaction.order_type,
        table_number: transaction.table_number,
        subtotal: transaction.subtotal,
        tax_amount: transaction.tax_amount,
        service_amount: transaction.service_amount,
        discount_amount: transaction.discount_amount,
        total_amount: transaction.total_amount,
        payment_method: transaction.payment_method,
        payment_status: transaction.payment_status,
        amount_paid: transaction.amount_paid,
        change_amount: transaction.change_amount,
        notes: transaction.notes,
        created_at: transaction.created_at,
      });

      if (items.length > 0) {
        await this.supabase.from('transaction_items').upsert(
          items.map((i) => ({
            id: i.id,
            transaction_id: i.transaction_id,
            business_id: i.business_id,
            product_id: i.product_id,
            product_name: i.product_name,
            product_sku: i.product_sku,
            unit_price: i.unit_price,
            cost_price: i.cost_price,
            quantity: i.quantity,
            subtotal: i.subtotal,
            notes: i.notes,
          }))
        );
      }

      await this.supabase.from('payments').upsert({
        id: payment.id,
        business_id: payment.business_id,
        transaction_id: payment.transaction_id,
        payment_method: payment.payment_method,
        amount: payment.amount,
        reference_code: payment.reference_code,
        status: payment.status,
        created_at: payment.created_at,
      });
      console.log(`[Supabase Online Sync] Transaksi ${transaction.invoice_number} berhasil disimpan ke Supabase!`);
    } catch (err: any) {
      console.warn('[Supabase Sync Warning]:', err.message);
    }
  }

  public async syncAllToSupabase(): Promise<{ success: boolean; message: string; counts: any }> {
    if (!this.supabase) {
      return {
        success: false,
        message: 'Klien Supabase belum terhubung. Konfigurasi URL dan Anon Key terlebih dahulu.',
        counts: {},
      };
    }
    try {
      const counts: any = {};
      // 1. Businesses
      if (this.data.businesses.length > 0) {
        const { error } = await this.supabase.from('businesses').upsert(this.data.businesses);
        if (error) console.warn('[Supabase businesses sync]:', error.message);
        counts.businesses = this.data.businesses.length;
      }
      // 2. Categories
      if (this.data.categories.length > 0) {
        const { error } = await this.supabase.from('categories').upsert(this.data.categories);
        if (error) console.warn('[Supabase categories sync]:', error.message);
        counts.categories = this.data.categories.length;
      }
      // 3. Products
      if (this.data.products.length > 0) {
        const { error } = await this.supabase.from('products').upsert(this.data.products);
        if (error) console.warn('[Supabase products sync]:', error.message);
        counts.products = this.data.products.length;
      }
      // 4. Inventory
      if (this.data.inventory.length > 0) {
        const { error } = await this.supabase.from('inventory').upsert(this.data.inventory);
        if (error) console.warn('[Supabase inventory sync]:', error.message);
        counts.inventory = this.data.inventory.length;
      }
      // 5. Users
      if (this.data.users.length > 0) {
        const { error } = await this.supabase.from('users').upsert(this.data.users);
        if (error) console.warn('[Supabase users sync]:', error.message);
        counts.users = this.data.users.length;
      }
      // 6. Transactions
      if (this.data.transactions.length > 0) {
        const { error } = await this.supabase.from('transactions').upsert(this.data.transactions);
        if (error) console.warn('[Supabase transactions sync]:', error.message);
        counts.transactions = this.data.transactions.length;
      }
      return {
        success: true,
        message: 'Seluruh data operasional berhasil disinkronisasi ke Supabase PostgreSQL online!',
        counts,
      };
    } catch (err: any) {
      return { success: false, message: err.message, counts: {} };
    }
  }

  private loadFromDisk() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          businesses: parsed.businesses || [],
          users: parsed.users || [],
          categories: parsed.categories || [],
          products: parsed.products || [],
          inventory: parsed.inventory || [],
          inventory_logs: parsed.inventory_logs || [],
          shifts: parsed.shifts || [],
          transactions: parsed.transactions || [],
          transaction_items: parsed.transaction_items || [],
          payments: parsed.payments || [],
          expenses: parsed.expenses || [],
          audit_logs: parsed.audit_logs || [],
        };
        this.isLoaded = true;
        this.ensureSingleMasterUser();
      } catch (err) {
        console.error('[Database] Error reading DB file, seeding fresh:', err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  /**
   * Ensures Requirement 4: Exactly one Master account exists (mdqputra@gmail.com / 990830).
   * Strips any secondary master account and keeps it persistently Active.
   */
  public ensureSingleMasterUser() {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('990830', salt);
    let master = this.data.users.find((u) => u.username.toLowerCase() === 'mdqputra@gmail.com' || u.role === 'MASTER');

    if (master) {
      master.username = 'mdqputra@gmail.com';
      master.password_hash = passwordHash;
      master.full_name = 'Master Administrator (MDQ Putra)';
      master.role = 'MASTER';
      master.status = 'ACTIVE';
      master.business_id = null;
    } else {
      master = {
        id: 'usr-master-01',
        business_id: null,
        username: 'mdqputra@gmail.com',
        password_hash: passwordHash,
        full_name: 'Master Administrator (MDQ Putra)',
        role: 'MASTER',
        phone: '+62 811-990-830',
        status: 'ACTIVE',
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.users.unshift(master);
    }

    // Strictly enforce: NEVER create a second Master (Requirement 4)
    this.data.users = this.data.users.filter((u) => u.role !== 'MASTER' || u.id === master!.id);
    this.saveToDisk();
  }

  public saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('[Database] Error writing to DB file:', err);
    }
  }

  private seedInitialData() {
    console.log('[Database] Seeding fresh production-ready foundation for RAHAYA COFFEE POS...');
    const now = new Date().toISOString();
    const salt = bcrypt.genSaltSync(10);

    // 1. Initial Business
    const businessId = 'biz-rahaya-01';
    const business: Business = {
      id: businessId,
      name: 'Rahaya Coffee - Flagship Store',
      code: 'RAHAYA-PUSAT',
      address: 'Jl. Surya Kencana No. 45, Sentra Kuliner, Jakarta Selatan',
      phone: '+62 812-9876-5432',
      tax_percentage: 10,
      service_percentage: 0,
      receipt_header: 'RAHAYA COFFEE - ARTISAN ESPRESSO & ROASTERY\nNikmati Setiap Tegukan Kopi Terbaik',
      receipt_footer: 'Terima kasih atas kunjungan Anda!\nFollow Instagram: @rahayacoffee\nWiFi Password: rahayacoffee',
      currency_symbol: 'Rp',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    };

    // 2. Users: Master, Owner, Cashier
    // Master: mdqputra@gmail.com / 990830 - Single Master as per Requirement 4
    const masterUser: User = {
      id: 'usr-master-01',
      business_id: null,
      username: 'mdqputra@gmail.com',
      password_hash: bcrypt.hashSync('990830', salt),
      full_name: 'Master Administrator (MDQ Putra)',
      role: 'MASTER',
      phone: '+62 811-990-830',
      status: 'ACTIVE',
      last_login_at: null,
      created_at: now,
      updated_at: now,
    };

    // Owner: owner_rahaya / RahayaOwner2026!
    const ownerUser: User = {
      id: 'usr-owner-01',
      business_id: businessId,
      username: 'owner_rahaya',
      password_hash: bcrypt.hashSync('RahayaOwner2026!', salt),
      full_name: 'Rian Raharja (Owner Rahaya)',
      role: 'OWNER',
      phone: '+62 812-3333-4444',
      status: 'ACTIVE',
      last_login_at: null,
      created_at: now,
      updated_at: now,
    };

    // Cashier: kasir_1 / Kasir123!
    const cashierUser: User = {
      id: 'usr-cashier-01',
      business_id: businessId,
      username: 'kasir_1',
      password_hash: bcrypt.hashSync('Kasir123!', salt),
      full_name: 'Dimas Barista Kasir',
      role: 'CASHIER',
      phone: '+62 857-1111-2222',
      status: 'ACTIVE',
      last_login_at: null,
      created_at: now,
      updated_at: now,
    };

    // 3. Categories (Exact specification: Coffee, Non Coffee, Food, Snack, Dessert)
    const categories: Category[] = [
      { id: 'cat-coffee', business_id: businessId, name: 'Coffee', icon: 'Coffee', sort_order: 1, created_at: now },
      { id: 'cat-non-coffee', business_id: businessId, name: 'Non Coffee', icon: 'CupSoda', sort_order: 2, created_at: now },
      { id: 'cat-food', business_id: businessId, name: 'Food', icon: 'Utensils', sort_order: 3, created_at: now },
      { id: 'cat-snack', business_id: businessId, name: 'Snack', icon: 'Cookie', sort_order: 4, created_at: now },
      { id: 'cat-dessert', business_id: businessId, name: 'Dessert', icon: 'Cake', sort_order: 5, created_at: now },
    ];

    // 4. Products & Inventory
    const rawProducts: Array<{
      id: string;
      category_id: string;
      name: string;
      sku: string;
      description: string;
      price: number;
      cost_price: number;
      stock: number;
      image_url: string;
    }> = [
      {
        id: 'prod-01',
        category_id: 'cat-coffee',
        name: 'Kopi Susu Rahaya Gula Aren',
        sku: 'RHY-COF-01',
        description: 'Signature espresso Rahaya blend, fresh milk, and organic palm sugar syrup with creamy texture.',
        price: 24000,
        cost_price: 9500,
        stock: 120,
        image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-02',
        category_id: 'cat-coffee',
        name: 'Rahaya Sea Salt Caramel Cloud',
        sku: 'RHY-COF-02',
        description: 'Double shot espresso, velvety sweet caramel foam with a hint of artisan sea salt.',
        price: 28000,
        cost_price: 11500,
        stock: 85,
        image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-03',
        category_id: 'cat-coffee',
        name: 'Americano / Long Black (Ice/Hot)',
        sku: 'RHY-COF-03',
        description: 'Clean, bold espresso extracted with Rahaya Arabica-Robusta balanced profile.',
        price: 20000,
        cost_price: 5000,
        stock: 250,
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-04',
        category_id: 'cat-coffee',
        name: 'Caffe Latte Creamy',
        sku: 'RHY-COF-04',
        description: 'Smooth steamed milk microfoam over balanced single origin espresso.',
        price: 25000,
        cost_price: 9000,
        stock: 140,
        image_url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-05',
        category_id: 'cat-coffee',
        name: 'Cappuccino Cinnamon Sprinkle',
        sku: 'RHY-COF-05',
        description: 'Classic equal third parts espresso, steamed milk, and airy foam with Ceylon cinnamon.',
        price: 25000,
        cost_price: 9000,
        stock: 110,
        image_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-06',
        category_id: 'cat-coffee',
        name: 'V60 Aceh Gayo Single Origin',
        sku: 'RHY-COF-06',
        description: 'Filter manual brew using light-medium roast Gayo beans. Notes of stone fruits and bergamot.',
        price: 32000,
        cost_price: 13000,
        stock: 45,
        image_url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-07',
        category_id: 'cat-non-coffee',
        name: 'Matcha Uji Artisan Latte',
        sku: 'RHY-NON-01',
        description: 'Authentic stone-ground Japanese ceremonial grade matcha whisked with fresh whole milk.',
        price: 28000,
        cost_price: 11000,
        stock: 75,
        image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-08',
        category_id: 'cat-non-coffee',
        name: 'Belgian Dark Chocolate Ganache',
        sku: 'RHY-NON-02',
        description: '70% premium Belgian dark chocolate melted with velvety milk, soothing and deep.',
        price: 27000,
        cost_price: 10500,
        stock: 80,
        image_url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-09',
        category_id: 'cat-non-coffee',
        name: 'Earl Grey Artisan Milk Tea',
        sku: 'RHY-NON-03',
        description: 'Fragrant bergamot black tea brewed slowly with rich milk and brown sugar.',
        price: 24000,
        cost_price: 8500,
        stock: 90,
        image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-10',
        category_id: 'cat-food',
        name: 'Nasi Goreng Spesial Rahaya',
        sku: 'RHY-FOD-01',
        description: 'Nasi goreng harum rempah khas dengan potongan ayam, telur mata sapi, dan acar segar.',
        price: 35000,
        cost_price: 14000,
        stock: 40,
        image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-11',
        category_id: 'cat-food',
        name: 'Rice Bowl Beef Black Pepper',
        sku: 'RHY-FOD-02',
        description: 'Irisan daging sapi empuk saus lada hitam pedas manis di atas nasi hangat.',
        price: 38000,
        cost_price: 16000,
        stock: 35,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-12',
        category_id: 'cat-snack',
        name: 'Crispy Truffle Fries',
        sku: 'RHY-SNK-01',
        description: 'Kentang goreng renyah dengan taburan keju parmesan dan aroma minyak truffle wangi.',
        price: 28000,
        cost_price: 11000,
        stock: 50,
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-13',
        category_id: 'cat-snack',
        name: 'Cireng Crispy Bumbu Rujak',
        sku: 'RHY-SNK-02',
        description: 'Cireng kenyal renyah khas Bandung disajikan dengan cocolan sambal rujak manis pedas.',
        price: 18000,
        cost_price: 6000,
        stock: 40,
        image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-14',
        category_id: 'cat-dessert',
        name: 'French Butter Croissant',
        sku: 'RHY-DES-01',
        description: 'Pastry klasik Prancis berlapis mentega harum dengan tekstur renyah dan lembut di dalam.',
        price: 22000,
        cost_price: 9000,
        stock: 25,
        image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-15',
        category_id: 'cat-dessert',
        name: 'Almond Pain au Chocolat',
        sku: 'RHY-DES-02',
        description: 'Pastry cokelat artisan berlapis kacang almond panggang renyah dan taburan gula halus.',
        price: 26000,
        cost_price: 11000,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'prod-16',
        category_id: 'cat-dessert',
        name: 'Basque Burnt Cheesecake Slice',
        sku: 'RHY-DES-03',
        description: 'Kue keju panggang Spanyol bertekstur lumer lembut dengan aroma karamel panggangan khas.',
        price: 32000,
        cost_price: 13000,
        stock: 18,
        image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=80',
      },
    ];

    const products: Product[] = [];
    const inventory: Inventory[] = [];

    rawProducts.forEach((p) => {
      products.push({
        id: p.id,
        business_id: businessId,
        category_id: p.category_id,
        name: p.name,
        sku: p.sku,
        description: p.description,
        price: p.price,
        cost_price: p.cost_price,
        track_inventory: true,
        image_url: p.image_url,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      });

      inventory.push({
        id: `inv-${p.id}`,
        business_id: businessId,
        product_id: p.id,
        current_stock: p.stock,
        min_stock_alert: 15,
        unit: 'porsi',
        updated_at: now,
      });
    });

    // 5. Shift
    const shiftId = 'shift-01';
    const shift: Shift = {
      id: shiftId,
      business_id: businessId,
      cashier_user_id: cashierUser.id,
      cashier_name: cashierUser.full_name,
      status: 'OPEN',
      opened_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      closed_at: null,
      starting_cash: 250000,
      expected_cash: 250000 + 48000,
      actual_cash: null,
      cash_difference: null,
      notes: 'Shift Pagi buka lancar. Kembalian kasir 250.000.',
      total_transactions: 1,
      total_sales_amount: 48000,
    };

    // 6. Sample Completed Transaction
    const transId = 'trx-sample-01';
    const transaction: Transaction = {
      id: transId,
      invoice_number: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`,
      business_id: businessId,
      shift_id: shiftId,
      cashier_user_id: cashierUser.id,
      cashier_name: cashierUser.full_name,
      customer_name: 'Budi Santoso',
      order_type: 'DINE_IN',
      table_number: 'Meja 04',
      subtotal: 48000,
      tax_amount: 4800,
      service_amount: 0,
      discount_amount: 0,
      total_amount: 52800,
      payment_method: 'QRIS',
      payment_status: 'COMPLETED',
      amount_paid: 52800,
      change_amount: 0,
      notes: 'Less ice pada Kopi Susu',
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    };

    const transactionItems: TransactionItem[] = [
      {
        id: 'titem-01',
        transaction_id: transId,
        business_id: businessId,
        product_id: 'prod-01',
        product_name: 'Kopi Susu Rahaya Gula Aren',
        product_sku: 'RHY-SIG-01',
        unit_price: 24000,
        cost_price: 9500,
        quantity: 2,
        subtotal: 48000,
        notes: 'Less sweet & extra creamy',
      },
    ];

    const payment: Payment = {
      id: 'pay-01',
      business_id: businessId,
      transaction_id: transId,
      payment_method: 'QRIS',
      amount: 52800,
      reference_code: 'QRIS-NMID-93821039',
      status: 'SUCCESS',
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    };

    // 7. Sample Expense
    const expense: Expense = {
      id: 'exp-01',
      business_id: businessId,
      shift_id: shiftId,
      user_id: ownerUser.id,
      title: 'Beli Es Batu Kristal 5 Bag',
      category: 'Bahan Baku',
      amount: 60000,
      notes: 'Beli darurat di agen es terdekat karena cuaca panas siang',
      date: new Date().toISOString().slice(0, 10),
      created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    };

    // 8. Audit Logs
    const auditLogs: AuditLog[] = [
      {
        id: 'log-01',
        business_id: null,
        user_id: masterUser.id,
        user_role: 'MASTER',
        action: 'SYSTEM_BOOTSTRAP',
        details: 'Initial database schema and Master account provisioned.',
        ip_address: '127.0.0.1',
        created_at: now,
      },
      {
        id: 'log-02',
        business_id: businessId,
        user_id: ownerUser.id,
        user_role: 'OWNER',
        action: 'TENANT_INITIALIZED',
        details: `Tenant "${business.name}" initialized with master menu & products.`,
        ip_address: '127.0.0.1',
        created_at: now,
      },
      {
        id: 'log-03',
        business_id: businessId,
        user_id: cashierUser.id,
        user_role: 'CASHIER',
        action: 'OPEN_SHIFT',
        details: 'Kasir membuka shift pagi dengan modal awal Rp 250.000',
        ip_address: '127.0.0.1',
        created_at: shift.opened_at,
      },
    ];

    this.data = {
      businesses: [business],
      users: [masterUser, ownerUser, cashierUser],
      categories,
      products,
      inventory,
      inventory_logs: [],
      shifts: [shift],
      transactions: [transaction],
      transaction_items: transactionItems,
      payments: [payment],
      expenses: [expense],
      audit_logs: auditLogs,
    };

    this.saveToDisk();
    console.log('[Database] Seed completed successfully!');
  }

  // --- Multi-Tenant Access & Query Methods ---

  public getBusiness(businessId: string): Business | undefined {
    return this.data.businesses.find((b) => b.id === businessId);
  }

  public getAllBusinesses(): Business[] {
    return this.data.businesses;
  }

  public addBusiness(biz: Business): Business {
    this.data.businesses.push(biz);
    this.saveToDisk();
    return biz;
  }

  public updateBusiness(businessId: string, updates: Partial<Business>): Business | null {
    const idx = this.data.businesses.findIndex((b) => b.id === businessId);
    if (idx === -1) return null;
    this.data.businesses[idx] = {
      ...this.data.businesses[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToDisk();
    return this.data.businesses[idx];
  }

  // Users
  public getUserByUsername(username: string): User | undefined {
    const q = username.trim().toLowerCase();
    return this.data.users.find(
      (u) =>
        u.username.toLowerCase() === q ||
        (u.role === 'MASTER' && (q === 'master' || q === 'mdqputra@gmail.com'))
    );
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUsersByBusiness(businessId: string): User[] {
    return this.data.users.filter((u) => u.business_id === businessId);
  }

  public getAllOwners(): User[] {
    return this.data.users.filter((u) => u.role === 'OWNER');
  }

  /**
   * Requirement 5: Satu Business dapat memiliki banyak Owner (A, B, C, D...).
   * Tidak ada batas maksimal Owner (unlimited).
   */
  public getOwnersByBusiness(businessId: string): User[] {
    return this.data.users.filter((u) => u.business_id === businessId && u.role === 'OWNER');
  }

  public addUser(user: User): User {
    // Requirement 4: Jangan pernah membuat Master kedua
    if (user.role === 'MASTER') {
      const existingMaster = this.data.users.find((u) => u.role === 'MASTER');
      if (existingMaster) {
        throw new Error('Akun Master hanya satu (mdqputra@gmail.com) dan tidak dapat dibuat lagi.');
      }
    }
    this.data.users.push(user);
    this.saveToDisk();
    return user;
  }

  public updateUser(userId: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;
    // Master cannot have role changed
    if (this.data.users[idx].role === 'MASTER' && updates.role && updates.role !== 'MASTER') {
      throw new Error('Peran akun Master tidak dapat diubah.');
    }
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToDisk();
    return this.data.users[idx];
  }

  // Categories
  public getCategoriesByBusiness(businessId: string): Category[] {
    return this.data.categories
      .filter((c) => c.business_id === businessId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public addCategory(cat: Category): Category {
    this.data.categories.push(cat);
    this.saveToDisk();
    return cat;
  }

  public updateCategory(id: string, businessId: string, updates: Partial<Category>): Category | null {
    const idx = this.data.categories.findIndex((c) => c.id === id && c.business_id === businessId);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.saveToDisk();
    return this.data.categories[idx];
  }

  public deleteCategory(id: string, businessId: string): boolean {
    const initialLen = this.data.categories.length;
    this.data.categories = this.data.categories.filter((c) => !(c.id === id && c.business_id === businessId));
    if (this.data.categories.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // Products & Inventory
  public getProductsByBusiness(businessId: string): (Product & { current_stock?: number; min_stock_alert?: number })[] {
    return this.data.products
      .filter((p) => p.business_id === businessId)
      .map((p) => {
        const inv = this.data.inventory.find((i) => i.product_id === p.id && i.business_id === businessId);
        return {
          ...p,
          current_stock: inv ? inv.current_stock : 0,
          min_stock_alert: inv ? inv.min_stock_alert : 10,
        };
      });
  }

  public getProductById(id: string, businessId: string): Product | undefined {
    return this.data.products.find((p) => p.id === id && p.business_id === businessId);
  }

  public addProduct(p: Product, initialStock: number = 50, minStockAlert: number = 10): Product {
    this.data.products.push(p);
    const inv: Inventory = {
      id: `inv-${p.id}`,
      business_id: p.business_id,
      product_id: p.id,
      current_stock: initialStock,
      min_stock_alert: minStockAlert,
      unit: 'porsi',
      updated_at: new Date().toISOString(),
    };
    this.data.inventory.push(inv);
    this.saveToDisk();
    return p;
  }

  public updateProduct(id: string, businessId: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex((p) => p.id === id && p.business_id === businessId);
    if (idx === -1) return null;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToDisk();
    return this.data.products[idx];
  }

  public deleteProduct(id: string, businessId: string): boolean {
    const idx = this.data.products.findIndex((p) => p.id === id && p.business_id === businessId);
    if (idx === -1) return false;
    this.data.products[idx].status = 'INACTIVE';
    this.data.products[idx].updated_at = new Date().toISOString();
    this.saveToDisk();
    return true;
  }

  // Inventory Stock
  public getInventoryByBusiness(businessId: string): (Inventory & { product_name: string; sku: string; price: number })[] {
    return this.data.inventory
      .filter((i) => i.business_id === businessId)
      .map((inv) => {
        const prod = this.data.products.find((p) => p.id === inv.product_id);
        return {
          ...inv,
          product_name: prod ? prod.name : 'Unknown Product',
          sku: prod ? prod.sku : '-',
          price: prod ? prod.price : 0,
        };
      });
  }

  public adjustStock(
    businessId: string,
    productId: string,
    adjustmentType: 'IN' | 'OUT' | 'ADJUSTMENT',
    amount: number,
    notes: string,
    userId: string
  ): Inventory | null {
    const inv = this.data.inventory.find((i) => i.product_id === productId && i.business_id === businessId);
    if (!inv) return null;

    const before = inv.current_stock;
    let after = before;
    if (adjustmentType === 'IN') {
      after = before + amount;
    } else if (adjustmentType === 'OUT') {
      after = Math.max(0, before - amount);
    } else if (adjustmentType === 'ADJUSTMENT') {
      after = Math.max(0, amount);
    }

    inv.current_stock = after;
    inv.updated_at = new Date().toISOString();

    const log: InventoryLog = {
      id: `invlog-${crypto.randomUUID()}`,
      business_id: businessId,
      product_id: productId,
      type: adjustmentType,
      quantity_change: after - before,
      stock_before: before,
      stock_after: after,
      notes,
      created_by_user_id: userId,
      created_at: new Date().toISOString(),
    };
    this.data.inventory_logs.push(log);
    this.saveToDisk();
    return inv;
  }

  // Shifts
  public getOpenShift(businessId: string, cashierUserId?: string): Shift | undefined {
    return this.data.shifts.find((s) => {
      const match = s.business_id === businessId && s.status === 'OPEN';
      if (cashierUserId) {
        return match && s.cashier_user_id === cashierUserId;
      }
      return match;
    });
  }

  public getShiftsByBusiness(businessId: string): Shift[] {
    return this.data.shifts
      .filter((s) => s.business_id === businessId)
      .sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
  }

  public openShift(shift: Shift): Shift {
    this.data.shifts.push(shift);
    this.saveToDisk();
    return shift;
  }

  public closeShift(
    shiftId: string,
    businessId: string,
    actualCash: number,
    notes: string
  ): Shift | null {
    const shift = this.data.shifts.find((s) => s.id === shiftId && s.business_id === businessId);
    if (!shift || shift.status === 'CLOSED') return null;

    shift.status = 'CLOSED';
    shift.closed_at = new Date().toISOString();
    shift.actual_cash = actualCash;
    shift.cash_difference = actualCash - shift.expected_cash;
    shift.notes = notes ? `${shift.notes}\n[Tutup]: ${notes}` : shift.notes;

    this.saveToDisk();
    return shift;
  }

  // Transactions
  public getTransactionsByBusiness(businessId: string, cashierUserId?: string): (Transaction & { items: TransactionItem[] })[] {
    return this.data.transactions
      .filter((t) => {
        if (t.business_id !== businessId) return false;
        if (cashierUserId && t.cashier_user_id !== cashierUserId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((t) => ({
        ...t,
        items: this.data.transaction_items.filter((ti) => ti.transaction_id === t.id),
      }));
  }

  public getTransactionById(transactionId: string, businessId: string): (Transaction & { items: TransactionItem[] }) | null {
    const t = this.data.transactions.find((tx) => tx.id === transactionId && tx.business_id === businessId);
    if (!t) return null;
    const items = this.data.transaction_items.filter((ti) => ti.transaction_id === t.id);
    return { ...t, items };
  }

  public createTransaction(
    transaction: Transaction,
    items: TransactionItem[],
    payment: Payment
  ): Transaction & { items: TransactionItem[] } {
    this.data.transactions.push(transaction);
    this.data.transaction_items.push(...items);
    this.data.payments.push(payment);

    // Update active shift if exists
    if (transaction.shift_id) {
      const shift = this.data.shifts.find((s) => s.id === transaction.shift_id);
      if (shift) {
        shift.total_transactions += 1;
        shift.total_sales_amount += transaction.total_amount;
        if (transaction.payment_method === 'CASH') {
          shift.expected_cash += transaction.total_amount;
        }
      }
    }

    // Deduct stock and log
    items.forEach((item) => {
      const inv = this.data.inventory.find((i) => i.product_id === item.product_id && i.business_id === transaction.business_id);
      if (inv) {
        const before = inv.current_stock;
        inv.current_stock = Math.max(0, inv.current_stock - item.quantity);
        inv.updated_at = new Date().toISOString();

        this.data.inventory_logs.push({
          id: `invlog-${crypto.randomUUID()}`,
          business_id: transaction.business_id,
          product_id: item.product_id,
          type: 'SALE',
          quantity_change: -item.quantity,
          stock_before: before,
          stock_after: inv.current_stock,
          notes: `Penjualan kasir #${transaction.invoice_number}`,
          created_by_user_id: transaction.cashier_user_id,
          created_at: new Date().toISOString(),
        });
      }
    });

    this.saveToDisk();

    // Sync to online Supabase PostgreSQL if configured
    if (this.supabase) {
      this.syncTransactionToSupabase(transaction, items, payment).catch((err) => {
        console.error('[Supabase Sync Warning]:', err.message);
      });
    }

    return { ...transaction, items };
  }

  // Expenses
  public getExpensesByBusiness(businessId: string): Expense[] {
    return this.data.expenses
      .filter((e) => e.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addExpense(expense: Expense): Expense {
    this.data.expenses.push(expense);
    this.saveToDisk();
    return expense;
  }

  public deleteExpense(id: string, businessId: string): boolean {
    const initialLen = this.data.expenses.length;
    this.data.expenses = this.data.expenses.filter((e) => !(e.id === id && e.business_id === businessId));
    if (this.data.expenses.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // Audit Logs
  public addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const entry: AuditLog = {
      ...log,
      id: `log-${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.push(entry);
    // Keep max 1000 logs in memory/disk
    if (this.data.audit_logs.length > 1000) {
      this.data.audit_logs = this.data.audit_logs.slice(-1000);
    }
    this.saveToDisk();
    return entry;
  }

  public getAuditLogs(businessId?: string | null): AuditLog[] {
    return this.data.audit_logs
      .filter((l) => (businessId !== undefined ? l.business_id === businessId : true))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 100);
  }
}

export const db = new DatabaseEngine();
