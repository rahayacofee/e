import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../auth';
import { User, Business } from '../types';

const router = Router();

// Apply auth + require role MASTER to all endpoints in this router
router.use(authenticateToken);
router.use(requireRoles(['MASTER']));

// GET /api/master/dashboard
// Strictly owner account statistics only! No operational or financial metrics!
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const owners = db.getAllOwners();
  const totalOwners = owners.length;
  const activeOwners = owners.filter((o) => o.status === 'ACTIVE').length;
  const inactiveOwners = totalOwners - activeOwners;

  // Recent owners with their associated business info
  const recentOwners = [...owners]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((o) => {
      const biz = o.business_id ? db.getBusiness(o.business_id) : null;
      return {
        id: o.id,
        username: o.username,
        full_name: o.full_name,
        phone: o.phone,
        status: o.status,
        created_at: o.created_at,
        last_login_at: o.last_login_at,
        business: biz
          ? {
              id: biz.id,
              name: biz.name,
              code: biz.code,
              address: biz.address,
              status: biz.status,
            }
          : null,
      };
    });

  const businesses = db.getAllBusinesses();

  res.json({
    summary: {
      total_owners: totalOwners,
      active_owners: activeOwners,
      inactive_owners: inactiveOwners,
      total_businesses: businesses.length,
    },
    recent_owners: recentOwners,
  });
});

// GET /api/master/owners
// List all owners with business details
router.get('/owners', (req: AuthenticatedRequest, res: Response) => {
  const allOwners = db.getAllOwners();
  const ownerCounts = new Map<string, number>();
  allOwners.forEach((o) => {
    if (o.business_id) ownerCounts.set(o.business_id, (ownerCounts.get(o.business_id) || 0) + 1);
  });
  const owners = allOwners.map((o) => {
    const biz = o.business_id ? db.getBusiness(o.business_id) : null;
    return {
      id: o.id,
      username: o.username,
      full_name: o.full_name,
      phone: o.phone,
      status: o.status,
      created_at: o.created_at,
      last_login_at: o.last_login_at,
      business: biz
        ? {
            id: biz.id,
            name: biz.name,
            code: biz.code,
            address: biz.address,
            phone: biz.phone,
            status: biz.status,
            owners_count: ownerCounts.get(biz.id) || 0,
          }
        : null,
    };
  });
  res.json({ owners });
});

// GET /api/master/businesses
// List all businesses with all assigned owners (Requirement 5: multi-owner support)
router.get('/businesses', (req: AuthenticatedRequest, res: Response) => {
  const businesses = db.getAllBusinesses().map((biz) => {
    const owners = db.getOwnersByBusiness(biz.id).map((o) => ({
      id: o.id,
      username: o.username,
      full_name: o.full_name,
      phone: o.phone,
      status: o.status,
      created_at: o.created_at,
      last_login_at: o.last_login_at,
    }));
    return {
      id: biz.id,
      name: biz.name,
      code: biz.code,
      address: biz.address,
      phone: biz.phone,
      status: biz.status,
      tax_percentage: biz.tax_percentage,
      service_percentage: biz.service_percentage,
      created_at: biz.created_at,
      owners_count: owners.length,
      owners,
    };
  });
  res.json({ businesses });
});

// POST /api/master/businesses
// Create a new business entity
router.post('/businesses', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, address, phone } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Nama bisnis wajib diisi.' });
      return;
    }

    const now = new Date().toISOString();
    const businessId = `biz-${crypto.randomUUID().slice(0, 8)}`;
    const newBiz: Business = {
      id: businessId,
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : `RHY-${Math.floor(1000 + Math.random() * 9000)}`,
      address: address ? address.trim() : 'Lokasi Bisnis Rahaya Coffee',
      phone: phone ? phone.trim() : '',
      tax_percentage: 10,
      service_percentage: 0,
      receipt_header: `${name.toUpperCase()}\nArtisan Coffee & Roastery`,
      receipt_footer: 'Terima kasih atas kunjungan Anda!\nFollow Instagram kami!',
      currency_symbol: 'Rp',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    };

    db.addBusiness(newBiz);

    // Add standard default categories
    const defaultCategories = [
      { id: `cat-sig-${businessId}`, business_id: businessId, name: 'Signature Coffee', icon: 'Sparkles', sort_order: 1, created_at: now },
      { id: `cat-esp-${businessId}`, business_id: businessId, name: 'Espresso Based', icon: 'Coffee', sort_order: 2, created_at: now },
      { id: `cat-non-${businessId}`, business_id: businessId, name: 'Non-Coffee', icon: 'CupSoda', sort_order: 3, created_at: now },
      { id: `cat-pas-${businessId}`, business_id: businessId, name: 'Pastry & Food', icon: 'Cake', sort_order: 4, created_at: now },
    ];
    defaultCategories.forEach((cat) => db.addCategory(cat));

    db.addAuditLog({
      business_id: businessId,
      user_id: req.user!.userId,
      user_role: 'MASTER',
      action: 'CREATE_BUSINESS',
      details: `Master membuat outlet bisnis baru "${newBiz.name}" (${newBiz.code}).`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.status(201).json({ message: 'Bisnis baru berhasil dibuat!', business: newBiz });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal membuat bisnis baru.' });
  }
});

// PUT /api/master/businesses/:id
// Update basic business info
router.put('/businesses/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, address, phone, status } = req.body;
    const biz = db.getBusiness(id);
    if (!biz) {
      res.status(404).json({ error: 'Bisnis tidak ditemukan.' });
      return;
    }

    const updated = db.updateBusiness(id, {
      name: name ? name.trim() : biz.name,
      code: code ? code.trim().toUpperCase() : biz.code,
      address: address !== undefined ? address.trim() : biz.address,
      phone: phone !== undefined ? phone.trim() : biz.phone,
      status: status || biz.status,
    });

    res.json({ message: 'Informasi dasar bisnis berhasil diperbarui.', business: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui bisnis.' });
  }
});

// POST /api/master/owners
// Create new Owner for an existing business OR new business. Immediately active! No limit on owners per business (Requirement 5).
router.post('/owners', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      username,
      password,
      full_name,
      phone,
      business_id,
      business_name,
      business_code,
      business_address,
      business_phone,
    } = req.body;

    if (!username || !password || !full_name) {
      res.status(400).json({ error: 'Username, password, dan nama lengkap wajib diisi.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password minimal 6 karakter.' });
      return;
    }

    const existingUser = db.getUserByUsername(username.trim());
    if (existingUser) {
      res.status(400).json({ error: 'Username atau email sudah digunakan, silakan pilih yang lain.' });
      return;
    }

    let targetBusiness: Business | undefined;
    const now = new Date().toISOString();

    if (business_id) {
      // Assigning an additional owner to an existing business (Requirement 5: Business A -> Owner A, B, C, D... unlimited)
      targetBusiness = db.getBusiness(business_id);
      if (!targetBusiness) {
        res.status(404).json({ error: 'Bisnis yang dipilih tidak ditemukan.' });
        return;
      }
    } else if (business_name) {
      // Creating a new business along with the owner
      const newBizId = `biz-${crypto.randomUUID().slice(0, 8)}`;
      targetBusiness = {
        id: newBizId,
        name: business_name.trim(),
        code: business_code ? business_code.trim().toUpperCase() : `RHY-${Math.floor(1000 + Math.random() * 9000)}`,
        address: business_address ? business_address.trim() : 'Lokasi Bisnis Rahaya Coffee',
        phone: business_phone ? business_phone.trim() : phone || '',
        tax_percentage: 10,
        service_percentage: 0,
        receipt_header: `${business_name.toUpperCase()}\nArtisan Coffee & Roastery`,
        receipt_footer: 'Terima kasih atas kunjungan Anda!\nFollow Instagram kami!',
        currency_symbol: 'Rp',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      };
      db.addBusiness(targetBusiness);

      const defaultCategories = [
        { id: `cat-sig-${newBizId}`, business_id: newBizId, name: 'Signature Coffee', icon: 'Sparkles', sort_order: 1, created_at: now },
        { id: `cat-esp-${newBizId}`, business_id: newBizId, name: 'Espresso Based', icon: 'Coffee', sort_order: 2, created_at: now },
        { id: `cat-non-${newBizId}`, business_id: newBizId, name: 'Non-Coffee', icon: 'CupSoda', sort_order: 3, created_at: now },
        { id: `cat-pas-${newBizId}`, business_id: newBizId, name: 'Pastry & Food', icon: 'Cake', sort_order: 4, created_at: now },
      ];
      defaultCategories.forEach((cat) => db.addCategory(cat));
    } else {
      res.status(400).json({ error: 'Pilih bisnis yang sudah ada atau masukkan nama bisnis baru.' });
      return;
    }

    // Create Owner User
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const ownerId = `usr-owner-${crypto.randomUUID().slice(0, 8)}`;

    const newOwner: User = {
      id: ownerId,
      business_id: targetBusiness.id,
      username: username.trim(),
      password_hash: passwordHash,
      full_name: full_name.trim(),
      role: 'OWNER',
      phone: phone ? phone.trim() : '',
      status: 'ACTIVE', // Instantly active as required
      last_login_at: null,
      created_at: now,
      updated_at: now,
    };

    db.addUser(newOwner);

    // Audit log
    db.addAuditLog({
      business_id: targetBusiness.id,
      user_id: req.user!.userId,
      user_role: 'MASTER',
      action: 'CREATE_OWNER',
      details: `Master membuat Owner baru "${newOwner.username}" untuk bisnis "${targetBusiness.name}" (${targetBusiness.code}).`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      message: 'Akun Owner berhasil dibuat dan langsung aktif!',
      owner: {
        id: newOwner.id,
        username: newOwner.username,
        full_name: newOwner.full_name,
        role: newOwner.role,
        status: newOwner.status,
      },
      business: targetBusiness,
    });
  } catch (err: any) {
    console.error('Create owner error:', err);
    res.status(500).json({ error: err.message || 'Gagal membuat akun owner.' });
  }
});

// PUT /api/master/owners/:id
// Edit owner data
router.put('/owners/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { full_name, phone, business_name, business_address, business_phone } = req.body;
    const owner = db.getUserById(id);
    if (!owner || owner.role !== 'OWNER') {
      res.status(404).json({ error: 'Owner tidak ditemukan.' });
      return;
    }

    const updatedUser = db.updateUser(id, {
      full_name: full_name ? full_name.trim() : owner.full_name,
      phone: phone !== undefined ? phone.trim() : owner.phone,
    });

    if (owner.business_id && business_name) {
      db.updateBusiness(owner.business_id, {
        name: business_name.trim(),
        address: business_address ? business_address.trim() : undefined,
        phone: business_phone ? business_phone.trim() : undefined,
      });
    }

    db.addAuditLog({
      business_id: owner.business_id,
      user_id: req.user!.userId,
      user_role: 'MASTER',
      action: 'UPDATE_OWNER',
      details: `Master memperbarui profil Owner "${owner.username}".`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.json({ message: 'Data Owner berhasil diperbarui.', owner: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui data Owner.' });
  }
});

// PATCH /api/master/owners/:id/status
// Toggle Owner status (ACTIVE / INACTIVE)
router.patch('/owners/:id/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      res.status(400).json({ error: 'Status harus ACTIVE atau INACTIVE.' });
      return;
    }

    const owner = db.getUserById(id);
    if (!owner || owner.role !== 'OWNER') {
      res.status(404).json({ error: 'Owner tidak ditemukan.' });
      return;
    }

    db.updateUser(id, { status });

    // Also sync business status
    if (owner.business_id) {
      db.updateBusiness(owner.business_id, { status });
    }

    db.addAuditLog({
      business_id: owner.business_id,
      user_id: req.user!.userId,
      user_role: 'MASTER',
      action: 'TOGGLE_OWNER_STATUS',
      details: `Master mengubah status Owner "${owner.username}" menjadi ${status}.`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.json({ message: `Status Owner berhasil diubah menjadi ${status}.`, status });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah status Owner.' });
  }
});

// POST /api/master/owners/:id/reset-password
// Master resets password for an Owner
router.post('/owners/:id/reset-password', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
      return;
    }

    const owner = db.getUserById(id);
    if (!owner || owner.role !== 'OWNER') {
      res.status(404).json({ error: 'Owner tidak ditemukan.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(new_password, salt);
    db.updateUser(id, { password_hash: hash });

    db.addAuditLog({
      business_id: owner.business_id,
      user_id: req.user!.userId,
      user_role: 'MASTER',
      action: 'RESET_OWNER_PASSWORD',
      details: `Master mereset password untuk Owner "${owner.username}".`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.json({ message: `Password untuk Owner "${owner.username}" berhasil direset.` });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mereset password.' });
  }
});

// GET /api/master/audit-logs
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  res.json({ logs });
});

// GET /api/master/database-status
router.get('/database-status', (req: AuthenticatedRequest, res: Response) => {
  const status = db.getSupabaseStatus();
  res.json({
    supabase: status,
    local_storage: 'ACTIVE (Persistent JSON Database Engine with relational integrity)',
    tables: [
      'businesses',
      'users',
      'categories',
      'products',
      'inventory',
      'inventory_logs',
      'shifts',
      'transactions',
      'transaction_items',
      'payments',
      'expenses',
      'audit_logs',
    ],
  });
});

export default router;
