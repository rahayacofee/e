import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from './types';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'rahaya-coffee-super-secret-pos-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (err) {
    return null;
  }
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Akses ditolak: Token otentikasi tidak ditemukan.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Akses ditolak: Sesi telah kedaluwarsa atau token tidak valid.' });
    return;
  }

  // Verify that the user still exists and is ACTIVE
  const user = db.getUserById(payload.userId);
  if (!user || user.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Akun Anda telah dinonaktifkan atau tidak ditemukan.' });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Ensures the authenticated user has one of the allowed roles.
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Silakan login terlebih dahulu.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Akses dilarang: Peran ${req.user.role} tidak memiliki hak akses ke endpoint ini.`,
      });
      return;
    }

    next();
  };
}

/**
 * Strict boundary: Master is FORBIDDEN from accessing operational data.
 */
export function forbidMasterFromOperational(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user && req.user.role === 'MASTER') {
    res.status(403).json({
      error: 'Pelanggaran Hak Akses: Master TIDAK diizinkan melihat atau memanipulasi data operasional bisnis (transaksi, produk, kasir, stok, omzet).',
    });
    return;
  }
  next();
}

/**
 * Strict Multi-Tenant Enforcement:
 * Resolves the active businessId strictly from the authenticated JWT token.
 * Client-submitted businessId is ignored or cross-checked.
 */
export function enforceTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  if (req.user.role === 'MASTER') {
    res.status(403).json({ error: 'Master does not have an operational tenant.' });
    return;
  }

  if (!req.user.businessId) {
    res.status(403).json({ error: 'Akun Anda tidak terikat dengan bisnis/tenant manapun.' });
    return;
  }

  const business = db.getBusiness(req.user.businessId);
  if (!business || business.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Bisnis/Outlet Anda sedang tidak aktif. Hubungi Administrator.' });
    return;
  }

  next();
}
