'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, CheckCircle, Calendar } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Borrowing {
  id: string;
  borrowed_at: string;
  due_date: string;
  returned_at?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  books: { id: string; title: string; author: string; cover_url?: string };
}

export default function ReadingHistoryPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBook, setDetailBook] = useState<any | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [showReviewForm, setShowReviewForm] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/borrowings/my-borrowings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const returned = Array.isArray(data) ? data.filter((b: any) => b?.status === 'returned') : [];
      setItems(returned);
      setLoading(false);
    };
    load();
  }, [token]);

  // Load and persist ratings/comments in localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('reading_ratings') : null;
      if (raw) setRatings(JSON.parse(raw));
      const rawC = typeof window !== 'undefined' ? localStorage.getItem('reading_comments') : null;
      if (rawC) setComments(JSON.parse(rawC));
    } catch (_e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('reading_ratings', JSON.stringify(ratings));
        localStorage.setItem('reading_comments', JSON.stringify(comments));
      }
    } catch (_e) {
      // ignore
    }
  }, [ratings, comments]);

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '-');

  const openDetail = async (bookId: string) => {
    try {
      setShowDetail(true);
      setDetailLoading(true);
      const res = await fetch(`${API_BASE}/api/books/${bookId}`);
      const data = await res.json();
      setDetailBook(data?.book || data || null);
    } catch (_e) {
      setDetailBook(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const setBookRating = (bookId: string, value: number) => {
    setRatings(prev => ({ ...prev, [bookId]: value }));
  };

  const saveReview = async (bookId: string) => {
    if (!token || !ratings[bookId]) {
      toast({ title: 'Pilih rating terlebih dahulu', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ book_id: bookId, rating: ratings[bookId], comment: comments[bookId] || null }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || 'Failed to save review');
      toast({ title: 'Review tersimpan' });
      setShowReviewForm(false);
    } catch (e: any) {
      toast({ title: 'Gagal menyimpan review', description: e?.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="member">
        <div className="p-10 text-center text-gray-600">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="member">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reading History</h1>
          <p className="text-muted-foreground">Books you have finished reading</p>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No completed books yet</h3>
              <p className="text-muted-foreground">Return a book to see it here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((b) => (
              <Card key={b.id} className="overflow-hidden max-w-[220px] mx-auto cursor-pointer" onClick={() => openDetail(b.books.id)}>
                <div className="aspect-[2/3] relative overflow-hidden">
                  {b.books.cover_url ? (
                    <img src={b.books.cover_url} alt={b.books.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-1 right-1">
                    <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      <CheckCircle className="w-3 h-3 mr-1" /> Finished
                    </span>
                  </div>
                </div>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-base line-clamp-2">{b.books.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">by {b.books.author}</p>
                  {typeof ratings[b.books.id] === 'number' && (
                    <div className="text-xs text-yellow-600">Rating: {ratings[b.books.id]} / 5</div>
                  )}
                </CardHeader>
                <CardContent className="space-y-2 py-2">
                  <div className="flex items-center text-xs">
                    <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                    <span>Returned: {formatDate(b.returned_at)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Book Detail Dialog */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Book Detail</DialogTitle>
            </DialogHeader>
            {detailLoading ? (
              <div className="p-6 text-center text-gray-600">Loading...</div>
            ) : detailBook ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <img
                    src={detailBook.cover_url || 'https://images.pexels.com/photos/415071/pexels-photo-415071.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
                    alt={detailBook.title}
                    className="w-full rounded"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <div className="text-lg font-semibold">{detailBook.title}</div>
                  <div className="text-sm text-gray-600">by {detailBook.author}</div>
                  {detailBook.published_year && (
                    <div className="text-sm text-gray-500">Published: {detailBook.published_year}</div>
                  )}
                  <div className="text-sm text-gray-500">ISBN: {detailBook.isbn || '-'}</div>
                  <div className="text-sm">Available: {(detailBook.available_copies ?? 0)} / {(detailBook.total_copies ?? 0)}</div>
                  {detailBook.description && (
                    <p className="text-sm text-gray-700 pt-2 whitespace-pre-line">{detailBook.description}</p>
                  )}
                  <div className="pt-3 space-y-2">
                    <Button size="sm" variant="outline" onClick={() => setShowReviewForm(s => !s)}>
                      {showReviewForm ? 'Tutup Form Review' : 'Rate & Review'}
                    </Button>
                    {showReviewForm && (
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm font-medium mb-1">Your Rating</div>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(n => (
                              <button
                                key={n}
                                aria-label={`Rate ${n}`}
                                onClick={() => setBookRating(detailBook.id, n)}
                                className={`px-2 py-1 rounded ${ (ratings[detailBook.id] || 0) >= n ? 'text-yellow-600' : 'text-gray-400'}`}
                              >
                                ★
                              </button>
                            ))}
                            <span className="text-xs text-gray-500 ml-2">{ratings[detailBook.id] ? `${ratings[detailBook.id]} / 5` : 'Not rated'}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Comment</div>
                          <Textarea
                            rows={3}
                            value={comments[detailBook.id] || ''}
                            onChange={(e) => setComments(prev => ({ ...prev, [detailBook.id]: e.target.value }))}
                            placeholder="Share your thoughts about this book..."
                          />
                        </div>
                        <div>
                          <Button size="sm" onClick={() => saveReview(detailBook.id)} disabled={!ratings[detailBook.id]}>Submit Review</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-600">Book not found</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}


