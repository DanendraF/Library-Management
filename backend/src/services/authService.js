import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../lib/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const TOKEN_TTL = process.env.JWT_TTL || '7d';

function signAppToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export async function signupUser({ name, email, password, role }) {
  if (!name || !email || !password || !role) {
    return { error: 'Missing required fields' };
  }
  if (!['member', 'librarian'].includes(role)) {
    return { error: 'Role not allowed' };
  }

  const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (signUpError || !signUpData?.user) {
    return { error: signUpError?.message || 'Failed to create user' };
  }
  const userId = signUpData.user.id;

  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({ id: userId, name, email, role });
  if (profileError) {
    return { error: profileError.message };
  }

  const token = signAppToken({ id: userId, name, email, role });
  return { token, user: { id: userId, name, email, role } };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    return { error: 'Missing required fields' };
  }
  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (signInError || !signInData?.user) {
    return { error: 'Invalid credentials' };
  }
  const userId = signInData.user.id;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id,name,email,role')
    .eq('id', userId)
    .single();
  if (profileError || !profile) {
    return { error: 'Profile not found' };
  }

  const token = signAppToken(profile);
  return { token, user: profile };
}

export function verifyAppToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { user: decoded };
  } catch (_e) {
    return { error: 'Invalid token' };
  }
}

export async function fetchAllUsers({ limit = 50, offset = 0 } = {}) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id,name,email,role,created_at,updated_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return { error: error.message };
  return { users: data || [] };
}

export async function fetchUserById(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id,name,email,role,created_at,updated_at')
    .eq('id', userId)
    .single();
  if (error) return { error: error.message };
  if (!data) return { error: 'User not found' };
  return { user: data };
}


