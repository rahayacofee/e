import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { authenticateToken, requireRoles, enforceTenant, AuthenticatedRequest } from '../auth';
import { Shift } from '../types';

const router = Router();

// Restricted to CASHIER role with active business tenant
router.use(authenticateToken);
router.use(requireRoles(['CASHIER']));
router.use(enforceTenant);

// GET /api/cashier/shift/current
// Get the currently active shift for this logged-in cashier
router.get('/shift/current', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const cashierId = req.user!.userId;
  const currentShift = db.getOpenShift(businessId, cashierId);
  res.json({
    shift: currentShift || null,
    has_open_shift: !!currentShift,
  });
});

// POST /api/cashier/shift/open
// Open a new shift with starting cash
router.post('/shift/open', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const cashierId = req.user!.userId;
  const { starting_cash, notes } = req.body;

  if (starting_cash === undefined || starting_cash < 0) {
    res.status(400).json({ error: 'Modal awal kasir (starting cash) wajib diisi valid.' });
    return;
  }

  // Check if cashier already has an open shift
  const existingShift = db.getOpenShift(businessId, cashierId);
  if (existingShift) {
    res.status(400).json({
      error: 'Anda masih memiliki shift yang sedang aktif. Silakan tutup shift sebelumnya terlebih dahulu.',
      shift: existingShift,
    });
    return;
  }

  const now = new Date().toISOString();
  const shiftId = `shift-${crypto.randomUUID().slice(0, 8)}`;
  const newShift: Shift = {
    id: shiftId,
    business_id: businessId,
    cashier_user_id: cashierId,
    cashier_name: req.user!.fullName,
    status: 'OPEN',
    opened_at: now,
    closed_at: null,
    starting_cash: Number(starting_cash),
    expected_cash: Number(starting_cash),
    actual_cash: null,
    cash_difference: null,
    notes: notes || 'Buka shift kasir.',
    total_transactions: 0,
    total_sales_amount: 0,
  };

  db.openShift(newShift);

  db.addAuditLog({
    business_id: businessId,
    user_id: cashierId,
    user_role: 'CASHIER',
    action: 'OPEN_SHIFT',
    details: `Kasir "${req.user!.fullName}" membuka shift #${shiftId} dengan modal awal Rp ${Number(starting_cash).toLocaleString('id-ID')}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.status(201).json({
    message: 'Shift berhasil dibuka! Selamat bertugas.',
    shift: newShift,
  });
});

// POST /api/cashier/shift/close
// Close the shift with counted cash
router.post('/shift/close', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const cashierId = req.user!.userId;
  const { actual_cash, notes } = req.body;

  if (actual_cash === undefined || actual_cash < 0) {
    res.status(400).json({ error: 'Uang fisik di laci (actual cash) wajib dihitung dan diisi.' });
    return;
  }

  const currentShift = db.getOpenShift(businessId, cashierId);
  if (!currentShift) {
    res.status(400).json({ error: 'Tidak ada shift yang sedang terbuka untuk ditutup.' });
    return;
  }

  const closed = db.closeShift(
    currentShift.id,
    businessId,
    Number(actual_cash),
    notes || 'Tutup shift kasir.'
  );

  if (!closed) {
    res.status(500).json({ error: 'Gagal menutup shift.' });
    return;
  }

  db.addAuditLog({
    business_id: businessId,
    user_id: cashierId,
    user_role: 'CASHIER',
    action: 'CLOSE_SHIFT',
    details: `Kasir "${req.user!.fullName}" menutup shift #${closed.id}. Fisik: Rp ${closed.actual_cash?.toLocaleString('id-ID')}, Selisih: Rp ${closed.cash_difference?.toLocaleString('id-ID')}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({
    message: 'Shift berhasil ditutup.',
    shift: closed,
  });
});

// GET /api/cashier/transactions
// Cashier can only see transactions they processed themselves
router.get('/transactions', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const cashierId = req.user!.userId;
  const transactions = db.getTransactionsByBusiness(businessId, cashierId);
  res.json({ transactions });
});

// GET /api/cashier/reports
// Cashier reports with filters for date, payment method, order type, and totals
router.get('/reports', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const cashierId = req.user!.userId;
  const { period, startDate, endDate, payment_method, order_type } = req.query;

  let transactions = db.getTransactionsByBusiness(businessId, cashierId);
  transactions = transactions.filter((t) => t.payment_status === 'COMPLETED');

  // Date filtering
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  if (period === 'today') {
    transactions = transactions.filter((t) => t.created_at.startsWith(todayStr));
  } else if (period === 'yesterday') {
    const yest = new Date(now.getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    transactions = transactions.filter((t) => t.created_at.startsWith(yest));
  } else if (period === 'this_week') {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    transactions = transactions.filter((t) => new Date(t.created_at) >= oneWeekAgo);
  } else if (period === 'this_month') {
    const monthPrefix = now.toISOString().slice(0, 7);
    transactions = transactions.filter((t) => t.created_at.startsWith(monthPrefix));
  } else if (startDate && endDate) {
    transactions = transactions.filter((t) => {
      const d = t.created_at.slice(0, 10);
      return d >= String(startDate) && d <= String(endDate);
    });
  }

  // Payment method filter
  if (payment_method && payment_method !== 'ALL') {
    transactions = transactions.filter((t) => t.payment_method === payment_method);
  }

  // Order type filter
  if (order_type && order_type !== 'ALL') {
    transactions = transactions.filter((t) => t.order_type === order_type);
  }

  const totalSales = transactions.reduce((sum, t) => sum + t.total_amount, 0);
  const totalSubtotal = transactions.reduce((sum, t) => sum + t.subtotal, 0);
  const totalTax = transactions.reduce((sum, t) => sum + t.tax_amount, 0);
  const totalDiscounts = transactions.reduce((sum, t) => sum + t.discount_amount, 0);

  const paymentBreakdown: Record<string, number> = { CASH: 0, QRIS: 0, TRANSFER: 0 };
  const orderTypeBreakdown: Record<string, number> = { DINE_IN: 0, TAKEAWAY: 0 };

  transactions.forEach((t) => {
    paymentBreakdown[t.payment_method] = (paymentBreakdown[t.payment_method] || 0) + t.total_amount;
    orderTypeBreakdown[t.order_type] = (orderTypeBreakdown[t.order_type] || 0) + 1;
  });

  res.json({
    summary: {
      total_sales: totalSales,
      total_orders: transactions.length,
      total_subtotal: totalSubtotal,
      total_tax: totalTax,
      total_discounts: totalDiscounts,
      average_order_value: transactions.length > 0 ? Math.round(totalSales / transactions.length) : 0,
    },
    payment_breakdown: paymentBreakdown,
    order_type_breakdown: orderTypeBreakdown,
    transactions,
  });
});

// GET /api/cashier/profile
router.get('/profile', (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.userId);
  const business = db.getBusiness(req.user!.businessId!);
  res.json({
    user: {
      id: user?.id,
      username: user?.username,
      full_name: user?.full_name,
      phone: user?.phone,
      role: user?.role,
      last_login_at: user?.last_login_at,
    },
    business,
  });
});

export default router;
