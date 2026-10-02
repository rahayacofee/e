import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../auth';

const router = Router();

// GET /api/database/schema-sql
// Generates PostgreSQL schema script tailored for Supabase
router.get('/schema-sql', authenticateToken, requireRoles(['MASTER', 'OWNER']), (req: AuthenticatedRequest, res: Response) => {
  const sql = `
-- =========================================================
-- RAHAYA COFFEE POS - SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Businesses (Tenants)
CREATE TABLE IF NOT EXISTS businesses (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  tax_percentage NUMERIC(5,2) DEFAULT 10.00,
  service_percentage NUMERIC(5,2) DEFAULT 0.00,
  receipt_header TEXT,
  receipt_footer TEXT,
  currency_symbol VARCHAR(10) DEFAULT 'Rp',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (Custom Auth - Master, Owner, Cashier)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('MASTER', 'OWNER', 'CASHIER')),
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  icon VARCHAR(50) DEFAULT 'Coffee',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(50),
  description TEXT,
  price NUMERIC(12,2) NOT NULL,
  cost_price NUMERIC(12,2) DEFAULT 0,
  track_inventory BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock_alert NUMERIC(10,2) DEFAULT 10,
  unit VARCHAR(50) DEFAULT 'porsi',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_product_inventory UNIQUE (business_id, product_id)
);

-- 6. Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  quantity_change NUMERIC(10,2) NOT NULL,
  stock_before NUMERIC(10,2) NOT NULL,
  stock_after NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_by_user_id VARCHAR(64) REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  cashier_user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  cashier_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'OPEN',
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  starting_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_cash NUMERIC(12,2),
  cash_difference NUMERIC(12,2),
  notes TEXT,
  total_transactions INT DEFAULT 0,
  total_sales_amount NUMERIC(12,2) DEFAULT 0
);

-- 8. Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) PRIMARY KEY,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  shift_id VARCHAR(64) REFERENCES shifts(id),
  cashier_user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  cashier_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) DEFAULT 'Pelanggan Walk-In',
  order_type VARCHAR(50) DEFAULT 'DINE_IN',
  table_number VARCHAR(50),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  service_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'COMPLETED',
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  change_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Transaction Items
CREATE TABLE IF NOT EXISTS transaction_items (
  id VARCHAR(64) PRIMARY KEY,
  transaction_id VARCHAR(64) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(50),
  unit_price NUMERIC(12,2) NOT NULL,
  cost_price NUMERIC(12,2) DEFAULT 0,
  quantity INT NOT NULL DEFAULT 1,
  subtotal NUMERIC(12,2) NOT NULL,
  notes TEXT
);

-- 10. Payments
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  transaction_id VARCHAR(64) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  reference_code VARCHAR(100),
  status VARCHAR(20) DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  shift_id VARCHAR(64) REFERENCES shifts(id),
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Operasional',
  amount NUMERIC(12,2) NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64),
  user_id VARCHAR(64) NOT NULL,
  user_role VARCHAR(20) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_users_business ON users(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_business ON inventory(business_id);
CREATE INDEX IF NOT EXISTS idx_shifts_business ON shifts(business_id);
CREATE INDEX IF NOT EXISTS idx_trx_business ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_trx_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_business ON audit_logs(business_id);
  `.trim();

  res.setHeader('Content-Type', 'text/plain');
  res.send(sql);
});

// GET /api/database/status
router.get('/status', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const status = db.getSupabaseStatus();
  res.json({
    supabase_configured: status.connected,
    supabase_url: status.url ? `${status.url.slice(0, 20)}...` : null,
    storage_engine: 'Hybrid (Cloud Supabase PostgreSQL client + ACID Persistent Storage File)',
    multi_tenant: true,
  });
});

// POST /api/database/configure
router.post('/configure', authenticateToken, requireRoles(['MASTER', 'OWNER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supabase_url, supabase_key } = req.body;
    if (!supabase_url || !supabase_key) {
      res.status(400).json({ error: 'Supabase URL dan Anon/Public Key wajib diisi (Hanya Anon/Public key, dilarang menggunakan service_role key).' });
      return;
    }

    const result = db.configureSupabase(supabase_url.trim(), supabase_key.trim());
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    const test = await db.testSupabaseConnection();
    res.json({
      message: result.message,
      test_result: test,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengonfigurasi Supabase' });
  }
});

// POST /api/database/test
router.post('/test', authenticateToken, requireRoles(['MASTER', 'OWNER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const test = await db.testSupabaseConnection();
    res.json(test);
  } catch (err: any) {
    res.status(500).json({ connected: false, message: err.message || 'Tes koneksi gagal' });
  }
});

// POST /api/database/sync-all
router.post('/sync-all', authenticateToken, requireRoles(['MASTER', 'OWNER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const syncRes = await db.syncAllToSupabase();
    res.json(syncRes);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Gagal sinkronisasi ke Supabase' });
  }
});

export default router;
