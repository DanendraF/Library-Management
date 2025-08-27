import { supabaseAdmin } from '../lib/supabase.js';

class ReviewService {
  async listByBook(bookId) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('id, user_id, book_id, rating, comment, created_at, users:user_id(id,name)')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async upsertReview({ user_id, book_id, rating, comment, borrowing_id }) {
    if (!user_id || !book_id || !rating) throw new Error('user_id, book_id, rating required');
    const payload = { user_id, book_id, rating, comment: comment || null, borrowing_id: borrowing_id || null };
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .upsert(payload, { onConflict: 'user_id,book_id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteReview(id) {
    const { error } = await supabaseAdmin.from('reviews').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'deleted' };
  }
}

export default new ReviewService();


