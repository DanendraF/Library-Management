'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react';

type Category = {
  id: string;
  name: string;
};

type Book = {
  id: string;
  title: string;
  author: string;
  category_id?: string | null;
  isbn?: string | null;
  published_year?: number | null;
  cover_url?: string | null;
  description?: string | null;
  total_copies: number;
  available_copies: number;
  rating?: number | null;
};

const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) || 'http://localhost:4000';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

export default function ManageBooksPage() {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState<Partial<Book>>({ total_copies: 1, available_copies: 1 });
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch = !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryId === 'all' || b.category_id === categoryId;
      return matchesSearch && matchesCategory;
    });
  }, [books, search, categoryId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const cats = await api<{ categories: Category[] }>(`/api/books/categories`);
      setCategories(cats.categories || []);
      const resp = await api<{ books: Book[] }>(`/api/books?limit=200`);
      setBooks(resp.books || []);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ total_copies: 1, available_copies: 1 });
    setIsDialogOpen(true);
  };

  const openEdit = (b: Book) => {
    setEditing(b);
    setForm({ ...b });
    setIsDialogOpen(true);
  };

  const onSubmit = async () => {
    try {
      const payload = {
        title: (form.title || '').trim(),
        author: (form.author || '').trim(),
        category_id: form.category_id || null,
        isbn: form.isbn || null,
        published_year: form.published_year || null,
        cover_url: form.cover_url || null,
        description: form.description || null,
        total_copies: Number(form.total_copies || 1),
        available_copies: Number(form.available_copies || 1),
        rating: form.rating ?? null,
      } as any;

      if (!payload.title || !payload.author) throw new Error('Title and Author are required');

      if (editing) {
        const updated = await api<{ book: Book }>(`/api/books/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setBooks((prev) => prev.map((b) => (b.id === editing.id ? updated.book : b)));
        toast({ title: 'Updated', description: 'Book updated successfully' });
      } else {
        const created = await api<{ book: Book }>(`/api/books`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setBooks((prev) => [created.book, ...prev]);
        toast({ title: 'Created', description: 'Book added successfully' });
      }
      setIsDialogOpen(false);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const onDelete = async (id: string) => {
    try {
      await api(`/api/books/${id}`, { method: 'DELETE' });
      setBooks((prev) => prev.filter((b) => b.id !== id));
      toast({ title: 'Deleted', description: 'Book deleted' });
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const confirmAndSave = () => setConfirmSaveOpen(true);
  const handleConfirmSave = async () => {
    setConfirmSaveOpen(false);
    await onSubmit();
  };
  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmDeleteOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (pendingDeleteId) {
      await onDelete(pendingDeleteId);
    }
    setPendingDeleteId(null);
    setConfirmDeleteOpen(false);
  };

  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' });
      return;
    }
    try {
      const resp = await api<{ category: Category }>(`/api/books/categories`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setCategories((prev) => [...prev, resp.category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
      toast({ title: 'Created', description: 'Category added' });
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <>
    <DashboardLayout userRole="librarian">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Manage Books</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAll} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" /> Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Book' : 'Add Book'}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={form.title || ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Author</Label>
                    <Input value={form.author || ''} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={(form.category_id ?? 'none') as string} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v === 'none' ? undefined : v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Uncategorized</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ISBN</Label>
                    <Input value={form.isbn || ''} onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Published Year</Label>
                    <Input type="number" value={form.published_year?.toString() || ''} onChange={(e) => setForm((f) => ({ ...f, published_year: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Cover URL</Label>
                    <Input value={form.cover_url || ''} onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Total Copies</Label>
                    <Input type="number" value={form.total_copies?.toString() || '1'} onChange={(e) => setForm((f) => ({ ...f, total_copies: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Available Copies</Label>
                    <Input type="number" value={form.available_copies?.toString() || '1'} onChange={(e) => setForm((f) => ({ ...f, available_copies: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={confirmAndSave}>{editing ? 'Save Changes' : 'Create'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Add Category */}
        <Card>
          <CardHeader>
            <CardTitle>Add Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <Input placeholder="e.g., Fiction" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="max-w-xs" />
              <Button onClick={addCategory}>Add</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Books</span>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or author" className="pl-9 w-64" />
                </div>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Copies</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => {
                    const catName = categories.find((c) => c.id === b.category_id)?.name || '-';
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.title}</TableCell>
                        <TableCell>{b.author}</TableCell>
                        <TableCell>{catName}</TableCell>
                        <TableCell>{b.available_copies}/{b.total_copies}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                            <Pencil className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => requestDelete(b.id)}>
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">No books found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
    
    {/* Confirm Save */}
    <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{editing ? 'Confirm update' : 'Confirm create'}</AlertDialogTitle>
          <AlertDialogDescription>
            {editing ? 'Are you sure you want to save changes to this book?' : 'Are you sure you want to add this new book?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmSave}>{editing ? 'Save' : 'Create'}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Confirm Delete */}
    <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete book</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Do you want to delete this book?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}


