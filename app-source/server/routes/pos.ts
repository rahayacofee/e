import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { authenticateToken, requireRoles, enforceTenant, AuthenticatedRequest } from '../auth';
import { Transaction, TransactionItem, Payment } from '../types';

const router = Router();

// Anti-double submission lock cache (in-memory sliding window)
const recentTransactionsCache = new Map<string, number>();

// POS can be accessed by CASHIER and OWNER
router.use(authenticateToken);
router.use(requireRoles(['CASHIER', 'OWNER']));
router.use(enforceTenant);

// GET /api/pos/init
// Loads active menu, categories, business config, and cashier shift status
router.get('/init', (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user!.businessId!;
  const business = db.getBusiness(businessId);
  const categories = db.getCategoriesByBusiness(businessId);
  const products = db.getProductsByBusiness(businessId).filter((p) => p.status === 'ACTIVE');

  // Check shift for cashier
  let activeShift = null;
  if (req.user!.role === 'CASHIER') {
    activeShift = db.getOpenShift(businessId, req.user!.userId);
  } else {
    // If owner is testing POS, get any open shift or null
    activeShift = db.getOpenShift(businessId);
  }

  res.json({
    business: {
      id: business?.id,
      name: business?.name,
      code: business?.code,
      address: business?.address,
      phone: business?.phone,
      tax_percentage: business?.tax_percentage || 0,
      service_percentage: business?.service_percentage || 0,
      receipt_header: business?.receipt_header || '',
      receipt_footer: business?.receipt_footer || '',
      currency_symbol: business?.currency_symbol || 'Rp',
    },
    categories,
    products,
    active_shift: activeShift || null,
  });
});

// POST /api/pos/transactions
// Process transaction with server-side price validation and stock deduction
router.post('/transactions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId!;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const userFullName = req.user!.fullName;
    const {
      customer_name,
      order_type,
      items,
      payment_method,
      amount_paid,
      discount_amount,
      notes,
    } = req.body;

    // 1. Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Keranjang pesanan masih kosong.' });
      return;
    }

    // 1b. Prevent double-submission / race conditions
    const itemFingerprint = items.map((i: any) => `${i.productId}:${i.quantity}`).sort().join('|');
    const requestKey = `${businessId}:${userId}:${itemFingerprint}:${payment_method}:${amount_paid}`;
    const lastAttempt = recentTransactionsCache.get(requestKey);
    if (lastAttempt && Date.now() - lastAttempt < 4000) {
      res.status(429).json({
        error: 'Transaksi serupa sedang diproses. Mohon tunggu sesaat untuk mencegah pembayaran ganda (double payment).',
      });
      return;
    }
    recentTransactionsCache.set(requestKey, Date.now());

    // Auto cleanup old keys
    if (recentTransactionsCache.size > 200) {
      const threshold = Date.now() - 30000;
      for (const [k, timestamp] of recentTransactionsCache.entries()) {
        if (timestamp < threshold) recentTransactionsCache.delete(k);
      }
    }

    // 2. Validate shift if Cashier
    let shiftId: string | null = null;
    if (userRole === 'CASHIER') {
      const activeShift = db.getOpenShift(businessId, userId);
      if (!activeShift) {
        res.status(400).json({
          error: 'Anda belum membuka shift! Silakan buka shift kasir terlebih dahulu sebelum melayani transaksi.',
          code: 'SHIFT_NOT_OPEN',
        });
        return;
      }
      shiftId = activeShift.id;
    } else {
      // If owner, attach active shift if exists
      const anyShift = db.getOpenShift(businessId);
      if (anyShift) shiftId = anyShift.id;
    }

    // 3. Fetch Business rules for Tax & Service
    const business = db.getBusiness(businessId);
    if (!business) {
      res.status(400).json({ error: 'Data outlet bisnis tidak valid.' });
      return;
    }

    // 4. CRITICAL SECURITY: Price calculation strictly from database!
    // Cashier cannot tamper with unit prices. Client sent items only specify productId, quantity, notes.
    let subtotal = 0;
    const transactionItems: TransactionItem[] = [];
    const transactionId = `trx-${crypto.randomUUID().slice(0, 10)}`;

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        res.status(400).json({ error: 'Item pesanan tidak valid.' });
        return;
      }

      // Fetch authentic product from database
      const product = db.getProductById(item.productId, businessId);
      if (!product || product.status !== 'ACTIVE') {
        res.status(400).json({
          error: `Produk "${product ? product.name : item.productId}" tidak tersedia atau sedang dinonaktifkan.`,
        });
        return;
      }

      // Check stock if inventory tracking is enabled
      if (product.track_inventory) {
        const invList = db.getInventoryByBusiness(businessId);
        const inv = invList.find((i) => i.product_id === product.id);
        if (inv && inv.current_stock < item.quantity) {
          res.status(400).json({
            error: `Stok untuk "${product.name}" tidak mencukupi (sisa ${inv.current_stock}, diminta ${item.quantity}).`,
          });
          return;
        }
      }

      const itemUnitPrice = Number(product.price);
      const itemCostPrice = Number(product.cost_price || 0);
      const itemSubtotal = itemUnitPrice * Number(item.quantity);
      subtotal += itemSubtotal;

      transactionItems.push({
        id: `ti-${crypto.randomUUID().slice(0, 8)}`,
        transaction_id: transactionId,
        business_id: businessId,
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        unit_price: itemUnitPrice, // SECURE: Taken from DB
        cost_price: itemCostPrice,
        quantity: Number(item.quantity),
        subtotal: itemSubtotal,
        notes: item.notes ? String(item.notes).trim() : '',
      });
    }

    // 5. Calculate Taxes, Service, Discounts, and Total
    const discount = Math.max(0, Number(discount_amount || 0));
    const subtotalAfterDiscount = Math.max(0, subtotal - discount);
    const taxRate = business.tax_percentage || 0;
    const serviceRate = business.service_percentage || 0;
    const taxAmount = Math.round(subtotalAfterDiscount * (taxRate / 100));
    const serviceAmount = Math.round(subtotalAfterDiscount * (serviceRate / 100));
    const totalAmount = subtotalAfterDiscount + taxAmount + serviceAmount;

    // 6. Validate Payment
    const validPaymentMethods = ['CASH', 'QRIS', 'DEBIT', 'CREDIT', 'TRANSFER'];
    const pMethod = validPaymentMethods.includes(payment_method) ? payment_method : 'CASH';
    const paid = Number(amount_paid || totalAmount);
    if (paid < totalAmount) {
      res.status(400).json({
        error: `Jumlah pembayaran kurang. Total: Rp ${totalAmount.toLocaleString('id-ID')}, Dibayar: Rp ${paid.toLocaleString('id-ID')}`,
      });
      return;
    }
    const changeAmount = pMethod === 'CASH' ? paid - totalAmount : 0;

    // 7. Generate Invoice Number: INV-YYYYMMDD-XXXX
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${datePrefix}-${randomSuffix}`;
    const now = new Date().toISOString();

    const transaction: Transaction = {
      id: transactionId,
      invoice_number: invoiceNumber,
      business_id: businessId,
      shift_id: shiftId,
      cashier_user_id: userId,
      cashier_name: userFullName,
      customer_name: customer_name ? customer_name.trim() : 'Pelanggan Walk-In',
      order_type: order_type || 'DINE_IN',
      table_number: null,
      subtotal,
      tax_amount: taxAmount,
      service_amount: serviceAmount,
      discount_amount: discount,
      total_amount: totalAmount,
      payment_method: pMethod,
      payment_status: 'COMPLETED',
      amount_paid: paid,
      change_amount: changeAmount,
      notes: notes ? notes.trim() : '',
      created_at: now,
    };

    const payment: Payment = {
      id: `pay-${crypto.randomUUID().slice(0, 8)}`,
      business_id: businessId,
      transaction_id: transactionId,
      payment_method: pMethod,
      amount: totalAmount,
      reference_code: pMethod === 'QRIS' ? `QRIS-${Date.now()}` : null,
      status: 'SUCCESS',
      created_at: now,
    };

    // 8. Commit to database (saves transaction, items, payment, updates shift, deducts inventory, records inventory logs)
    const result = db.createTransaction(transaction, transactionItems, payment);

    // 9. Audit Log
    db.addAuditLog({
      business_id: businessId,
      user_id: userId,
      user_role: userRole,
      action: 'CREATE_TRANSACTION',
      details: `Transaksi ${invoiceNumber} selesai (${pMethod}). Total: Rp ${totalAmount.toLocaleString('id-ID')}. Kasir: ${userFullName}`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      message: 'Transaksi berhasil diselesaikan!',
      transaction: result,
      receipt: {
        business: {
          name: business.name,
          address: business.address,
          phone: business.phone,
          header: business.receipt_header,
          footer: business.receipt_footer,
          currency: business.currency_symbol,
        },
        transaction: {
          id: transaction.id,
          invoice_number: transaction.invoice_number,
          date: transaction.created_at,
          cashier: transaction.cashier_name,
          customer: transaction.customer_name,
          order_type: transaction.order_type,
          table_number: transaction.table_number,
          items: transactionItems,
          subtotal: transaction.subtotal,
          discount_amount: transaction.discount_amount,
          tax_amount: transaction.tax_amount,
          service_amount: transaction.service_amount,
          total_amount: transaction.total_amount,
          payment_method: transaction.payment_method,
          amount_paid: transaction.amount_paid,
          change_amount: transaction.change_amount,
        },
      },
    });
  } catch (err: any) {
    console.error('POS transaction error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat memproses transaksi.' });
  }
});

export default router;
