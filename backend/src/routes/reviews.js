import { Router } from 'express';
import reviewService from '../services/reviewService.js';
import { authenticateToken } from '../lib/auth.js';

const router = Router();

// List reviews by book
router.get('/book/:bookId', async (req, res) => {
  try {
    const data = await reviewService.listByBook(req.params.bookId);
    res.json({ reviews: data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Create/update own review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { rating, comment, book_id, borrowing_id } = req.body || {};
    const data = await reviewService.upsertReview({
      user_id: req.user.id,
      book_id,
      rating,
      comment,
      borrowing_id,
    });
    res.status(201).json({ review: data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Delete review (admin/librarian)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    if (!['admin','librarian'].includes(role)) return res.status(403).json({ message: 'Access denied' });
    const data = await reviewService.deleteReview(req.params.id);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;


