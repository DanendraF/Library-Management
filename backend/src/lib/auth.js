import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabase.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    
    // Get user from database to ensure they still exist and get latest data
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Add user info to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};
