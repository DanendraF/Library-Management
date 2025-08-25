import { supabaseAdmin } from '../lib/supabase.js';

export async function listCategories() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id,name,created_at,updated_at')
    .order('name');
  if (error) return { error: error.message };
  return { categories: data || [] };
}

export async function createCategory({ name }) {
  if (!name) return { error: 'Name is required' };
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ name })
    .select('id,name,created_at,updated_at')
    .single();
  if (error) return { error: error.message };
  return { category: data };
}

export async function listBooks({ search, categoryId, limit = 50, offset = 0 } = {}) {
  let query = supabaseAdmin
    .from('books')
    .select('id,title,author,category_id,isbn,published_year,cover_url,description,total_copies,available_copies,rating,created_at,updated_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (categoryId) query = query.eq('category_id', categoryId);
  if (search) {
    // basic ilike on title/author
    query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { books: data || [] };
}

export async function getBookById(id) {
  const { data, error } = await supabaseAdmin
    .from('books')
    .select('id,title,author,category_id,isbn,published_year,cover_url,description,total_copies,available_copies,rating,created_at,updated_at')
    .eq('id', id)
    .single();
  if (error) return { error: error.message };
  if (!data) return { error: 'Book not found' };
  return { book: data };
}

export async function createBook(payload) {
  const required = ['title', 'author'];
  for (const k of required) {
    if (!payload?.[k]) return { error: `${k} is required` };
  }
  const { data, error } = await supabaseAdmin
    .from('books')
    .insert(payload)
    .select('id')
    .single();
  if (error) return { error: error.message };
  return getBookById(data.id);
}

export async function updateBook(id, payload) {
  const { error } = await supabaseAdmin
    .from('books')
    .update(payload)
    .eq('id', id);
  if (error) return { error: error.message };
  return getBookById(id);
}

export async function deleteBook(id) {
  const { error } = await supabaseAdmin
    .from('books')
    .delete()
    .eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function createBooksBulk(rawBooks = []) {
  if (!Array.isArray(rawBooks) || rawBooks.length === 0) {
    return { error: 'books array is required' };
  }
  const sanitized = rawBooks.map((b) => {
    const title = (b?.title || '').trim();
    const author = (b?.author || '').trim();
    if (!title || !author) return null;
    const total = Number(b?.total_copies ?? 1);
    const available = Number(b?.available_copies ?? total);
    return {
      title,
      author,
      category_id: b?.category_id || null,
      isbn: b?.isbn || null,
      published_year: b?.published_year ?? null,
      cover_url: b?.cover_url || null,
      description: b?.description || null,
      total_copies: total,
      available_copies: available,
      rating: b?.rating ?? null,
    };
  }).filter(Boolean);

  if (sanitized.length === 0) return { error: 'No valid books to insert' };

  const { data, error } = await supabaseAdmin
    .from('books')
    .insert(sanitized)
    .select('id,title,author,category_id,isbn,published_year,cover_url,description,total_copies,available_copies,rating,created_at,updated_at');
  if (error) return { error: error.message };
  return { books: data || [] };
}


