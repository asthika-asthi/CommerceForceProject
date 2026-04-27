import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = AuthService.verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Your session is invalid. Please sign in again.' });
  }

  if (decoded.expired) {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again to continue.' });
  }

  req.user = decoded;
  next();
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'client')) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

export const isSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden: Superadmin access required' });
  }
  next();
};
