import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db';
import { authenticateToken, requireRoles, enforceTenant, AuthenticatedRequest } from '../auth';
import { Product, Category, Expense, User } from '../types';

const router = Router();

// Strict security: Authenticated + OWNER role + Tenant isolation
router.use(authenticateToken);
router.use(requireRoles(['OWNER']));
router.use(enforceTenant);

// GET /api/owner/dashboard
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const business = db.getBusiness(businessId);
  const products = db.getProductsByBusiness(businessId);
  const inventory = db.getInventoryByBusiness(businessId);
  const transactions = db.getTransactionsByBusiness(businessId);
  const expenses = db.getExpensesByBusiness(businessId);
  const activeShift = db.getOpenShift(businessId);

  // Today's date filter (YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTransactions = transactions.filter((t) => t.created_at.startsWith(todayStr) && t.payment_status === 'COMPLETED');
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total_amount, 0);
  const todaySubtotal = todayTransactions.reduce((sum, t) => sum + t.subtotal, 0);
  const todayOrders = todayTransactions.length;

  // Calculate today's HPP (cost of goods sold)
  let todayHpp = 0;
  todayTransactions.forEach((t) => {
    t.items.forEach((item) => {
      todayHpp += (item.cost_price || 0) * item.quantity;
    });
  });

  const todayExpenses = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const todayNetProfit = todaySubtotal - todayHpp - todayExpenses;

  // Low stock products alert (stock <= min_stock_alert)
  const lowStockItems = inventory.filter((i) => i.current_stock <= i.min_stock_alert);

  // Payment method breakdown
  const paymentBreakdown: Record<string, { count: number; total: number }> = {
    CASH: { count: 0, total: 0 },
    QRIS: { count: 0, total: 0 },
    DEBIT: { count: 0, total: 0 },
    CREDIT: { count: 0, total: 0 },
    TRANSFER: { count: 0, total: 0 },
  };

  todayTransactions.forEach((t) => {
    if (paymentBreakdown[t.payment_method]) {
      paymentBreakdown[t.payment_method].count += 1;
      paymentBreakdown[t.payment_method].total += t.total_amount;
    }
  });

  // Top selling products today
  const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  todayTransactions.forEach((t) => {
    t.items.forEach((item) => {
      const existing = productSalesMap.get(item.product_id) || { name: item.product_name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.subtotal;
      productSalesMap.set(item.product_id, existing);
    });
  });

  const topSelling = Array.from(productSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  res.json({
    business,
    metrics: {
      today_revenue: todayRevenue,
      today_orders: todayOrders,
      today_net_profit: todayNetProfit,
      today_expenses: todayExpenses,
      low_stock_count: lowStockItems.length,
      active_shift: activeShift
        ? {
            id: activeShift.id,
            cashier_name: activeShift.cashier_name,
            opened_at: activeShift.opened_at,
            expected_cash: activeShift.expected_cash,
          }
        : null,
    },
    payment_breakdown: paymentBreakdown,
    top_selling: topSelling,
    low_stock_items: lowStockItems.slice(0, 6),
    recent_transactions: transactions.slice(0, 8),
  });
});

// --- PRODUCT CATALOG ---

// GET /api/owner/products
router.get('/products', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const products = db.getProductsByBusiness(businessId);
  const categories = db.getCategoriesByBusiness(businessId);
  res.json({ products, categories });
});

// POST /api/owner/products
router.post('/products', (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId!;
    const { name, category_id, sku, description, price, cost_price, track_inventory, initial_stock, min_stock_alert, image_url } = req.body;

    if (!name || price === undefined || !category_id) {
      res.status(400).json({ error: 'Nama, kategori, dan harga jual produk wajib diisi.' });
      return;
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      id: `prod-${crypto.randomUUID().slice(0, 8)}`,
      business_id: businessId,
      category_id,
      name: name.trim(),
      sku: sku ? sku.trim().toUpperCase() : `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      description: description ? description.trim() : '',
      price: Number(price),
      cost_price: Number(cost_price || 0),
      track_inventory: track_inventory !== false,
      image_url: image_url ? image_url.trim() : 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    };

    const saved = db.addProduct(newProduct, Number(initial_stock || 50), Number(min_stock_alert || 10));

    db.addAuditLog({
      business_id: businessId,
      user_id: req.user!.userId,
      user_role: 'OWNER',
      action: 'CREATE_PRODUCT',
      details: `Owner menambahkan produk "${newProduct.name}" harga Rp ${newProduct.price.toLocaleString('id-ID')}`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.status(201).json({ message: 'Produk berhasil ditambahkan!', product: saved });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambahkan produk.' });
  }
});

// PUT /api/owner/products/:id
router.put('/products/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId!;
    const { id } = req.params;
    const { name, category_id, sku, description, price, cost_price, track_inventory, image_url, status } = req.body;

    const existing = db.getProductById(id, businessId);
    if (!existing) {
      res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return;
    }

    const updated = db.updateProduct(id, businessId, {
      name: name ? name.trim() : undefined,
      category_id: category_id || undefined,
      sku: sku ? sku.trim().toUpperCase() : undefined,
      description: description !== undefined ? description.trim() : undefined,
      price: price !== undefined ? Number(price) : undefined,
      cost_price: cost_price !== undefined ? Number(cost_price) : undefined,
      track_inventory: track_inventory !== undefined ? Boolean(track_inventory) : undefined,
      image_url: image_url !== undefined ? image_url.trim() : undefined,
      status: status || undefined,
    });

    db.addAuditLog({
      business_id: businessId,
      user_id: req.user!.userId,
      user_role: 'OWNER',
      action: 'UPDATE_PRODUCT',
      details: `Owner memperbarui produk "${existing.name}".`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.json({ message: 'Produk berhasil diperbarui!', product: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui produk.' });
  }
});

// DELETE /api/owner/products/:id
router.delete('/products/:id', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const { id } = req.params;

  const success = db.deleteProduct(id, businessId);
  if (!success) {
    res.status(404).json({ error: 'Produk tidak ditemukan.' });
    return;
  }

  db.addAuditLog({
    business_id: businessId,
    user_id: req.user!.userId,
    user_role: 'OWNER',
    action: 'DELETE_PRODUCT',
    details: `Owner menonaktifkan produk ID ${id}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({ message: 'Produk berhasil dinonaktifkan.' });
});

// --- CATEGORIES ---

// GET /api/owner/categories
router.get('/categories', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const categories = db.getCategoriesByBusiness(businessId);
  res.json({ categories });
});

// POST /api/owner/categories
router.post('/categories', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const { name, icon } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Nama kategori wajib diisi.' });
    return;
  }

  const existing = db.getCategoriesByBusiness(businessId);
  const newCat: Category = {
    id: `cat-${crypto.randomUUID().slice(0, 8)}`,
    business_id: businessId,
    name: name.trim(),
    icon: icon || 'Coffee',
    sort_order: existing.length + 1,
    created_at: new Date().toISOString(),
  };

  db.addCategory(newCat);
  res.status(201).json({ category: newCat });
});

// --- INVENTORY & STOCK ---

// GET /api/owner/stock
router.get('/stock', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const inventory = db.getInventoryByBusiness(businessId);
  res.json({ inventory });
});

// POST /api/owner/stock/adjust
router.post('/stock/adjust', (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId!;
    const { product_id, type, amount, notes } = req.body;

    if (!product_id || !type || amount === undefined) {
      res.status(400).json({ error: 'Product ID, tipe penyesuaian (IN/OUT/ADJUSTMENT), dan jumlah wajib diisi.' });
      return;
    }

    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type)) {
      res.status(400).json({ error: 'Tipe harus IN (Stok Masuk), OUT (Stok Keluar), atau ADJUSTMENT (Koreksi Opname).' });
      return;
    }

    const updated = db.adjustStock(
      businessId,
      product_id,
      type,
      Number(amount),
      notes || `Penyesuaian stok oleh ${req.user!.username}`,
      req.user!.userId
    );

    if (!updated) {
      res.status(404).json({ error: 'Data stok produk tidak ditemukan.' });
      return;
    }

    db.addAuditLog({
      business_id: businessId,
      user_id: req.user!.userId,
      user_role: 'OWNER',
      action: 'ADJUST_STOCK',
      details: `Penyesuaian stok produk ${product_id} (${type} ${amount}). Catatan: ${notes || '-'}`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.json({ message: 'Stok berhasil diperbarui!', inventory: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui stok.' });
  }
});

// --- CASHIER MANAGEMENT ---

// GET /api/owner/cashiers
router.get('/cashiers', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const users = db.getUsersByBusiness(businessId);
  const cashiers = users
    .filter((u) => u.role === 'CASHIER')
    .map((u) => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      phone: u.phone,
      status: u.status,
      last_login_at: u.last_login_at,
      created_at: u.created_at,
    }));
  res.json({ cashiers });
});

// POST /api/owner/cashiers
// Owner creates Cashier (immediately active!)
router.post('/cashiers', (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId!;
    const { username, password, full_name, phone } = req.body;

    if (!username || !password || !full_name) {
      res.status(400).json({ error: 'Username, password, dan nama kasir wajib diisi.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password minimal 6 karakter.' });
      return;
    }

    const existing = db.getUserByUsername(username.trim());
    if (existing) {
      res.status(400).json({ error: 'Username sudah digunakan, pilih username lain.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const now = new Date().toISOString();

    const newCashier: User = {
      id: `usr-cashier-${crypto.randomUUID().slice(0, 8)}`,
      business_id: businessId,
      username: username.trim(),
      password_hash: passwordHash,
      full_name: full_name.trim(),
      role: 'CASHIER',
      phone: phone ? phone.trim() : '',
      status: 'ACTIVE', // Instantly active
      last_login_at: null,
      created_at: now,
      updated_at: now,
    };

    db.addUser(newCashier);

    db.addAuditLog({
      business_id: businessId,
      user_id: req.user!.userId,
      user_role: 'OWNER',
      action: 'CREATE_CASHIER',
      details: `Owner membuat akun Kasir baru "${newCashier.username}" (${newCashier.full_name}).`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      message: 'Akun Kasir berhasil dibuat dan langsung aktif!',
      cashier: {
        id: newCashier.id,
        username: newCashier.username,
        full_name: newCashier.full_name,
        phone: newCashier.phone,
        status: newCashier.status,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat akun kasir.' });
  }
});

// PUT /api/owner/cashiers/:id
router.put('/cashiers/:id', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const { id } = req.params;
  const { full_name, phone } = req.body;

  const cashier = db.getUserById(id);
  if (!cashier || cashier.business_id !== businessId || cashier.role !== 'CASHIER') {
    res.status(404).json({ error: 'Kasir tidak ditemukan.' });
    return;
  }

  const updated = db.updateUser(id, {
    full_name: full_name ? full_name.trim() : undefined,
    phone: phone !== undefined ? phone.trim() : undefined,
  });

  res.json({ message: 'Data Kasir berhasil diperbarui.', cashier: updated });
});

// PATCH /api/owner/cashiers/:id/status
router.patch('/cashiers/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const { id } = req.params;
  const { status } = req.body;

  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    res.status(400).json({ error: 'Status harus ACTIVE atau INACTIVE.' });
    return;
  }

  const cashier = db.getUserById(id);
  if (!cashier || cashier.business_id !== businessId || cashier.role !== 'CASHIER') {
    res.status(404).json({ error: 'Kasir tidak ditemukan.' });
    return;
  }

  db.updateUser(id, { status });

  db.addAuditLog({
    business_id: businessId,
    user_id: req.user!.userId,
    user_role: 'OWNER',
    action: 'TOGGLE_CASHIER_STATUS',
    details: `Owner mengubah status Kasir "${cashier.username}" menjadi ${status}.`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({ message: `Status Kasir diubah menjadi ${status}.` });
});

// POST /api/owner/cashiers/:id/reset-password
router.post('/cashiers/:id/reset-password', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.length < 6) {
    res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
    return;
  }

  const cashier = db.getUserById(id);
  if (!cashier || cashier.business_id !== businessId || cashier.role !== 'CASHIER') {
    res.status(404).json({ error: 'Kasir tidak ditemukan.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(new_password, salt);

  db.updateUser(id, { password_hash: hash });

  db.addAuditLog({
    business_id: businessId,
    user_id: req.user!.userId,
    user_role: 'OWNER',
    action: 'RESET_CASHIER_PASSWORD',
    details: `Owner mereset password Kasir "${cashier.username}".`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({ message: `Password Kasir "${cashier.username}" berhasil direset.` });
});

// --- SHIFTS ---

// GET /api/owner/shifts
router.get('/shifts', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const shifts = db.getShiftsByBusiness(businessId);
  res.json({ shifts });
});

// --- TRANSACTIONS ---

// GET /api/owner/transactions
router.get('/transactions', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const transactions = db.getTransactionsByBusiness(businessId);
  res.json({ transactions });
});

// --- EXPENSES ---

// GET /api/owner/expenses
router.get('/expenses', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const expenses = db.getExpensesByBusiness(businessId);
  res.json({ expenses });
});

// POST /api/owner/expenses
router.post('/expenses', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const { title, category, amount, notes, date } = req.body;

  if (!title || !amount) {
    res.status(400).json({ error: 'Judul dan nominal pengeluaran wajib diisi.' });
    return;
  }

  const activeShift = db.getOpenShift(businessId);
  const now = new Date().toISOString();

  const expense: Expense = {
    id: `exp-${crypto.randomUUID().slice(0, 8)}`,
    business_id: businessId,
    shift_id: activeShift ? activeShift.id : null,
    user_id: req.user!.userId,
    title: title.trim(),
    category: category || 'Operasional',
    amount: Number(amount),
    notes: notes || '',
    date: date || now.slice(0, 10),
    created_at: now,
  };

  db.addExpense(expense);

  db.addAuditLog({
    business_id: businessId,
    user_id: req.user!.userId,
    user_role: 'OWNER',
    action: 'CREATE_EXPENSE',
    details: `Pengeluaran dicatat: ${expense.title} sebesar Rp ${expense.amount.toLocaleString('id-ID')}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.status(201).json({ message: 'Pengeluaran berhasil dicatat!', expense });
});

// DELETE /api/owner/expenses/:id
router.delete('/expenses/:id', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const { id } = req.params;

  const success = db.deleteExpense(id, businessId);
  if (!success) {
    res.status(404).json({ error: 'Pengeluaran tidak ditemukan.' });
    return;
  }

  res.json({ message: 'Pengeluaran berhasil dihapus.' });
});

// --- REPORTS ---

// GET /api/owner/reports
router.get('/reports', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const { period, startDate, endDate, payment_method, order_type } = req.query;

  let transactions = db.getTransactionsByBusiness(businessId);
  const expenses = db.getExpensesByBusiness(businessId);
  let completed = transactions.filter((t) => t.payment_status === 'COMPLETED');

  // Filter by date / period
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  if (period === 'today') {
    completed = completed.filter((t) => t.created_at.startsWith(todayStr));
  } else if (period === 'yesterday') {
    const yest = new Date(now.getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    completed = completed.filter((t) => t.created_at.startsWith(yest));
  } else if (period === 'this_week') {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    completed = completed.filter((t) => new Date(t.created_at) >= oneWeekAgo);
  } else if (period === 'this_month') {
    const monthPrefix = now.toISOString().slice(0, 7);
    completed = completed.filter((t) => t.created_at.startsWith(monthPrefix));
  } else if (startDate && endDate) {
    completed = completed.filter((t) => {
      const d = t.created_at.slice(0, 10);
      return d >= String(startDate) && d <= String(endDate);
    });
  }

  // Filter by payment method
  if (payment_method && payment_method !== 'ALL') {
    completed = completed.filter((t) => t.payment_method === payment_method);
  }

  // Filter by order type
  if (order_type && order_type !== 'ALL') {
    completed = completed.filter((t) => t.order_type === order_type);
  }

  const totalRevenue = completed.reduce((sum, t) => sum + t.total_amount, 0);
  const totalSubtotal = completed.reduce((sum, t) => sum + t.subtotal, 0);
  const totalTax = completed.reduce((sum, t) => sum + t.tax_amount, 0);
  const totalDiscounts = completed.reduce((sum, t) => sum + t.discount_amount, 0);

  let totalHpp = 0;
  completed.forEach((t) => {
    t.items.forEach((item) => {
      totalHpp += (item.cost_price || 0) * item.quantity;
    });
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalSubtotal - totalHpp - totalExpenseAmount;

  // Best selling products
  const productMetrics: Record<string, { name: string; sku: string; sold: number; revenue: number; hpp: number }> = {};
  completed.forEach((t) => {
    t.items.forEach((item) => {
      if (!productMetrics[item.product_id]) {
        productMetrics[item.product_id] = {
          name: item.product_name,
          sku: item.product_sku,
          sold: 0,
          revenue: 0,
          hpp: 0,
        };
      }
      productMetrics[item.product_id].sold += item.quantity;
      productMetrics[item.product_id].revenue += item.subtotal;
      productMetrics[item.product_id].hpp += (item.cost_price || 0) * item.quantity;
    });
  });

  const bestSellers = Object.values(productMetrics).sort((a, b) => b.sold - a.sold);

  // Payment method statistics
  const paymentStats: Record<string, number> = {};
  completed.forEach((t) => {
    paymentStats[t.payment_method] = (paymentStats[t.payment_method] || 0) + t.total_amount;
  });

  // Expense by category
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  });

  res.json({
    summary: {
      total_revenue: totalRevenue,
      total_subtotal: totalSubtotal,
      total_tax: totalTax,
      total_discounts: totalDiscounts,
      total_hpp: totalHpp,
      total_expenses: totalExpenseAmount,
      net_profit: netProfit,
      total_orders: completed.length,
      average_order_value: completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0,
    },
    best_sellers: bestSellers,
    payment_stats: paymentStats,
    expense_by_category: expenseByCategory,
    transactions: completed,
  });
});

// --- BUSINESS SETTINGS ---

// GET /api/owner/settings
router.get('/settings', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const business = db.getBusiness(businessId);
  res.json({ business });
});

// PUT /api/owner/settings
router.put('/settings', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const { name, address, phone, tax_percentage, service_percentage, receipt_header, receipt_footer } = req.body;

  const updated = db.updateBusiness(businessId, {
    name: name ? name.trim() : undefined,
    address: address !== undefined ? address.trim() : undefined,
    phone: phone !== undefined ? phone.trim() : undefined,
    tax_percentage: tax_percentage !== undefined ? Number(tax_percentage) : undefined,
    service_percentage: service_percentage !== undefined ? Number(service_percentage) : undefined,
    receipt_header: receipt_header !== undefined ? receipt_header.trim() : undefined,
    receipt_footer: receipt_footer !== undefined ? receipt_footer.trim() : undefined,
  });

  db.addAuditLog({
    business_id: businessId,
    user_id: req.user!.userId,
    user_role: 'OWNER',
    action: 'UPDATE_BUSINESS_SETTINGS',
    details: 'Owner memperbarui pengaturan outlet & struk kasir.',
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({ message: 'Pengaturan bisnis berhasil disimpan!', business: updated });
});

export default router;
