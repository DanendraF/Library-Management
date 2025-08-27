import { supabaseAdmin } from '../lib/supabase.js';

class BorrowingService {
    // Get all borrowings (for admin/librarian)
    async getAllBorrowings(filters = {}) {
        try {
            let query = supabaseAdmin
                .from('borrowings')
                .select(`
                    *,
                    users:user_id(id, email, name, role),
                    books:book_id(id, title, author, isbn, cover_url)
                `)
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.user_id) {
                query = query.eq('user_id', filters.user_id);
            }
            if (filters.book_id) {
                query = query.eq('book_id', filters.book_id);
            }
            if (filters.overdue) {
                query = query.lt('due_date', new Date().toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Failed to fetch borrowings: ${error.message}`);
        }
    }

    // Get borrowings by user ID
    async getBorrowingsByUserId(userId) {
        try {
            const { data, error } = await supabaseAdmin
                .from('borrowings')
                .select(`
                    *,
                    books:book_id(id, title, author, isbn, cover_url, published_year)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Failed to fetch user borrowings: ${error.message}`);
        }
    }

    // Get borrowing by ID
    async getBorrowingById(borrowingId) {
        try {
            const { data, error } = await supabaseAdmin
                .from('borrowings')
                .select(`
                    *,
                    users:user_id(id, email, name, role),
                    books:book_id(id, title, author, isbn, cover_url, published_year, total_copies, available_copies)
                `)
                .eq('id', borrowingId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Failed to fetch borrowing: ${error.message}`);
        }
    }

    // Create new borrowing
    async createBorrowing(borrowingData) {
        try {
            const { user_id, book_id, due_date, notes } = borrowingData;

            // Validate required fields
            if (!user_id || !book_id || !due_date) {
                throw new Error('user_id, book_id, and due_date are required');
            }

            // Check if book is available
            const { data: book, error: bookError } = await supabaseAdmin
                .from('books')
                .select('available_copies, total_copies')
                .eq('id', book_id)
                .single();

            if (bookError) throw bookError;
            if (book.available_copies <= 0) {
                throw new Error('Book is not available for borrowing');
            }

            // Check if user already borrowed this book
            const { data: existingBorrowing, error: checkError } = await supabaseAdmin
                .from('borrowings')
                .select('id')
                .eq('user_id', user_id)
                .eq('book_id', book_id)
                .eq('status', 'borrowed')
                .single();

            if (existingBorrowing) {
                throw new Error('User has already borrowed this book');
            }

            // Create borrowing
            const { data, error } = await supabaseAdmin
                .from('borrowings')
                .insert({
                    user_id,
                    book_id,
                    due_date: new Date(due_date).toISOString(),
                    notes: notes || null,
                    status: 'borrowed'
                })
                .select()
                .single();

            if (error) throw error;

            // Update book available copies
            await supabaseAdmin
                .from('books')
                .update({ available_copies: book.available_copies - 1 })
                .eq('id', book_id);

            return data;
        } catch (error) {
            throw new Error(`Failed to create borrowing: ${error.message}`);
        }
    }

    // Return a book
    async returnBook(borrowingId) {
        try {
            // Ambil data borrowing minimal untuk validasi dan referensi book_id
            const { data: borrowingRow, error: borrowingErr } = await supabaseAdmin
                .from('borrowings')
                .select('id, book_id, status')
                .eq('id', borrowingId)
                .single();

            if (borrowingErr || !borrowingRow) {
                throw new Error('Borrowing not found');
            }

            if (borrowingRow.status === 'returned') {
                throw new Error('Book has already been returned');
            }

            // Update status peminjaman menjadi returned
            const { data: updatedBorrowing, error: updateBorrowingErr } = await supabaseAdmin
                .from('borrowings')
                .update({
                    status: 'returned',
                    returned_at: new Date().toISOString()
                })
                .eq('id', borrowingId)
                .select()
                .single();

            if (updateBorrowingErr) throw updateBorrowingErr;

            // Ambil stok buku terbaru
            const { data: bookRow, error: bookErr } = await supabaseAdmin
                .from('books')
                .select('available_copies, total_copies')
                .eq('id', borrowingRow.book_id)
                .single();

            if (bookErr || !bookRow) {
                throw new Error('Book not found for this borrowing');
            }

            const nextAvailable = Math.min(
                bookRow.total_copies || 0,
                (bookRow.available_copies || 0) + 1
            );

            // Update stok buku berdasarkan nilai terkini
            const { error: updateBookErr } = await supabaseAdmin
                .from('books')
                .update({ available_copies: nextAvailable })
                .eq('id', borrowingRow.book_id);

            if (updateBookErr) throw updateBookErr;

            // Kembalikan borrowing lengkap (dengan relasi) setelah update
            return await this.getBorrowingById(borrowingId);
        } catch (error) {
            throw new Error(`Failed to return book: ${error.message}`);
        }
    }

    // Update borrowing
    async updateBorrowing(borrowingId, updateData) {
        try {
            const { data, error } = await supabaseAdmin
                .from('borrowings')
                .update(updateData)
                .eq('id', borrowingId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Failed to update borrowing: ${error.message}`);
        }
    }

    // Delete borrowing (admin/librarian only)
    async deleteBorrowing(borrowingId) {
        try {
            // Get borrowing details first
            const borrowing = await this.getBorrowingById(borrowingId);
            if (!borrowing) {
                throw new Error('Borrowing not found');
            }

            // If book is still borrowed, update available copies
            if (borrowing.status === 'borrowed') {
                await supabaseAdmin
                    .from('books')
                    .update({ 
                        available_copies: borrowing.books.available_copies + 1 
                    })
                    .eq('id', borrowing.book_id);
            }

            const { error } = await supabaseAdmin
                .from('borrowings')
                .delete()
                .eq('id', borrowingId);

            if (error) throw error;
            return { message: 'Borrowing deleted successfully' };
        } catch (error) {
            throw new Error(`Failed to delete borrowing: ${error.message}`);
        }
    }

    // Get overdue borrowings
    async getOverdueBorrowings() {
        try {
            const { data, error } = await supabaseAdmin
                .from('borrowings')
                .select(`
                    *,
                    users:user_id(id, email, name),
                    books:book_id(id, title, author)
                `)
                .lt('due_date', new Date().toISOString())
                .eq('status', 'borrowed')
                .order('due_date', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Failed to fetch overdue borrowings: ${error.message}`);
        }
    }

    // Get borrowing statistics
    async getBorrowingStats() {
        try {
            const { data, error } = await supabaseAdmin
                .from('borrowings')
                .select('status, created_at');

            if (error) throw error;

            const stats = {
                total: data.length,
                borrowed: data.filter(b => b.status === 'borrowed').length,
                returned: data.filter(b => b.status === 'returned').length,
                overdue: data.filter(b => 
                    b.status === 'borrowed' && 
                    new Date(b.due_date) < new Date()
                ).length
            };

            return stats;
        } catch (error) {
            throw new Error(`Failed to fetch borrowing stats: ${error.message}`);
        }
    }
}

export default new BorrowingService();
