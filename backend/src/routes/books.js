import { Router } from 'express';
import { listCategories, createCategory, listBooks, getBookById, createBook, updateBook, deleteBook, createBooksBulk } from '../services/bookService.js';

const router = Router();

// Categories
router.get('/categories', async (req, res) => {
  const result = await listCategories();
  if (result.error) return res.status(400).json({ message: result.error });
  return res.json(result);
});

router.post('/categories', async (req, res) => {
  const result = await createCategory({ name: req.body?.name });
  if (result.error) return res.status(400).json({ message: result.error });
  return res.status(201).json(result);
});

// Books
router.get('/', async (req, res) => {
  const { search, categoryId } = req.query;
  const limit = Math.max(1, Math.min(200, parseInt(String(req.query.limit || '50'), 10)));
  const offset = Math.max(0, parseInt(String(req.query.offset || '0'), 10));
  const result = await listBooks({ search, categoryId, limit, offset });
  if (result.error) return res.status(400).json({ message: result.error });
  return res.json({ ...result, limit, offset });
});

router.get('/:id', async (req, res) => {
  const result = await getBookById(req.params.id);
  if (result.error) return res.status(404).json({ message: result.error });
  return res.json(result);
});

router.post('/', async (req, res) => {
  const result = await createBook(req.body || {});
  if (result.error) return res.status(400).json({ message: result.error });
  return res.status(201).json(result);
});

// Bulk insert books
router.post('/bulk', async (req, res) => {
  const result = await createBooksBulk(req.body?.books || []);
  if (result.error) return res.status(400).json({ message: result.error });
  return res.status(201).json(result);
});

router.patch('/:id', async (req, res) => {
  const result = await updateBook(req.params.id, req.body || {});
  if (result.error) return res.status(400).json({ message: result.error });
  return res.json(result);
});

router.delete('/:id', async (req, res) => {
  const result = await deleteBook(req.params.id);
  if (result.error) return res.status(400).json({ message: result.error });
  return res.json(result);
});

export default router;


