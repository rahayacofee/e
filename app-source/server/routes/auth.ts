import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username dan password wajib diisi.' });
      return;
    }

    const user = db.getUserByUsername(username.trim());
    if (!user) {
      res.status(401).json({ error: 'Username atau password salah.' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Akun Anda dinonaktifkan. Hubungi Administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Username atau password salah.' });
      return;
    }

    // Check business status if owner or cashier
    let business = null;
    if (user.business_id) {
      business = db.getBusiness(user.business_id);
      if (!business || business.status !== 'ACTIVE') {
        res.status(403).json({ error: 'Bisnis/Outlet Anda sedang nonaktif. Hubungi Master Admin.' });
        return;
      }
    }

    // Update last login
    db.updateUser(user.id, { last_login_at: new Date().toISOString() });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      businessId: user.business_id,
      fullName: user.full_name,
    });

    // Record audit log
    db.addAuditLog({
      business_id: user.business_id,
      user_id: user.id,
      user_role: user.role,
      action: 'USER_LOGIN',
      details: `User ${user.username} (${user.role}) berhasil login.`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        business_id: user.business_id,
        phone: user.phone,
      },
      business: business
        ? {
            id: business.id,
            name: business.name,
            code: business.code,
            address: business.address,
            phone: business.phone,
            tax_percentage: business.tax_percentage,
            service_percentage: business.service_percentage,
            receipt_header: business.receipt_header,
            receipt_footer: business.receipt_footer,
            currency_symbol: business.currency_symbol,
          }
        : null,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan internal pada server.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  const user = db.getUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan' });
    return;
  }

  let business = null;
  if (user.business_id) {
    business = db.getBusiness(user.business_id) || null;
  }

  let openShift = null;
  if (user.role === 'CASHIER' && user.business_id) {
    openShift = db.getOpenShift(user.business_id, user.id) || null;
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      business_id: user.business_id,
      phone: user.phone,
      status: user.status,
      last_login_at: user.last_login_at,
    },
    business,
    open_shift: openShift,
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password || new_password.length < 6) {
      res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
      return;
    }

    const user = db.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan.' });
      return;
    }

    const isMatch = await bcrypt.compare(old_password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ error: 'Password lama salah.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(new_password, salt);
    db.updateUser(user.id, { password_hash: newHash });

    db.addAuditLog({
      business_id: user.business_id,
      user_id: user.id,
      user_role: user.role,
      action: 'CHANGE_PASSWORD',
      details: `User ${user.username} mengubah password sendiri.`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.json({ success: true, message: 'Password berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui password.' });
  }
});

export default router;
