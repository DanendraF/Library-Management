import { Router } from 'express';
import { loginUser, signupUser, verifyAppToken, fetchAllUsers, fetchUserById } from '../services/authService.js';

const router = Router();

router.post('/signup', async (req, res) => {
  const result = await signupUser(req.body || {});
  if (result.error) return res.status(400).json({ message: result.error });
  return res.status(201).json(result);
});

router.post('/login', async (req, res) => {
  const result = await loginUser(req.body || {});
  if (result.error) return res.status(401).json({ message: result.error });
  return res.json(result);
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  const result = verifyAppToken(token);
  if (result.error) return res.status(401).json({ message: result.error });
  return res.json(result);
});

// Public: list users (no JWT). Uses service role on server; reveals limited fields by default
router.get('/users', async (req, res) => {
  const limit = Math.max(1, Math.min(200, parseInt(String(req.query.limit || '50'), 10)));
  const offset = Math.max(0, parseInt(String(req.query.offset || '0'), 10));
  const includeEmail = String(req.query.includeEmail || 'false').toLowerCase() === 'true';
  const result = await fetchAllUsers({ limit, offset });
  if (result.error) return res.status(400).json({ message: result.error });
  const users = (result.users || []).map(u => (
    includeEmail ? u : { id: u.id, name: u.name, role: u.role, created_at: u.created_at, updated_at: u.updated_at }
  ));
  return res.json({ users, limit, offset });
});

// Public: get user by id (no JWT). Limited fields by default
router.get('/users/:id', async (req, res) => {
  const includeEmail = String(req.query.includeEmail || 'false').toLowerCase() === 'true';
  const result = await fetchUserById(req.params.id);
  if (result.error) return res.status(404).json({ message: result.error });
  const u = result.user;
  const user = includeEmail ? u : { id: u.id, name: u.name, role: u.role, created_at: u.created_at, updated_at: u.updated_at };
  return res.json({ user });
});

export default router;


