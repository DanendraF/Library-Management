import express from 'express';
import borrowingService from '../services/borrowingService.js';
import { authenticateToken } from '../lib/auth.js';

const router = express.Router();

// Get all borrowings (admin/librarian only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        
        if (!['admin', 'librarian'].includes(role)) {
            return res.status(403).json({ message: 'Access denied. Admin or librarian required.' });
        }

        const filters = {
            status: req.query.status,
            user_id: req.query.user_id,
            book_id: req.query.book_id,
            overdue: req.query.overdue === 'true'
        };

        const borrowings = await borrowingService.getAllBorrowings(filters);
        res.json(borrowings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get borrowings by current user
router.get('/my-borrowings', authenticateToken, async (req, res) => {
    try {
        const borrowings = await borrowingService.getBorrowingsByUserId(req.user.id);
        res.json(borrowings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get borrowing by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.user;

        const borrowing = await borrowingService.getBorrowingById(id);
        
        if (!borrowing) {
            return res.status(404).json({ message: 'Borrowing not found' });
        }

        // Check if user can access this borrowing
        if (role !== 'admin' && role !== 'librarian' && borrowing.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(borrowing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new borrowing
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        const { user_id, book_id, due_date, notes } = req.body;

        // Validate input
        if (!book_id || !due_date) {
            return res.status(400).json({ message: 'book_id and due_date are required' });
        }

        // Set user_id based on role
        const borrowingUserId = role === 'admin' || role === 'librarian' ? user_id : req.user.id;

        const borrowingData = {
            user_id: borrowingUserId,
            book_id,
            due_date,
            notes
        };

        const borrowing = await borrowingService.createBorrowing(borrowingData);
        res.status(201).json(borrowing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Return a book
router.patch('/:id/return', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.user;

        // Get borrowing to check permissions
        const borrowing = await borrowingService.getBorrowingById(id);
        if (!borrowing) {
            return res.status(404).json({ message: 'Borrowing not found' });
        }

        // Check if user can return this book
        if (role !== 'admin' && role !== 'librarian' && borrowing.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const returnedBorrowing = await borrowingService.returnBook(id);
        res.json(returnedBorrowing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update borrowing (admin/librarian only)
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        
        if (!['admin', 'librarian'].includes(role)) {
            return res.status(403).json({ message: 'Access denied. Admin or librarian required.' });
        }

        const { id } = req.params;
        const updateData = req.body;

        const borrowing = await borrowingService.updateBorrowing(id, updateData);
        res.json(borrowing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete borrowing (admin/librarian only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        
        if (!['admin', 'librarian'].includes(role)) {
            return res.status(403).json({ message: 'Access denied. Admin or librarian required.' });
        }

        const { id } = req.params;
        const result = await borrowingService.deleteBorrowing(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get overdue borrowings (admin/librarian only)
router.get('/overdue/list', authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        
        if (!['admin', 'librarian'].includes(role)) {
            return res.status(403).json({ message: 'Access denied. Admin or librarian required.' });
        }

        const overdueBorrowings = await borrowingService.getOverdueBorrowings();
        res.json(overdueBorrowings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get borrowing statistics (admin/librarian only)
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        
        if (!['admin', 'librarian'].includes(role)) {
            return res.status(403).json({ message: 'Access denied. Admin or librarian required.' });
        }

        const stats = await borrowingService.getBorrowingStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
