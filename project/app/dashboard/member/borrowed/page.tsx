'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, BookOpen, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface Borrowing {
  id: string;
  borrowed_at: string;
  due_date: string;
  returned_at?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  notes?: string;
  books: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    cover_url?: string;
    published_year?: number;
  };
}

export default function MemberBorrowedPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBook, setDetailBook] = useState<any | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    if (user && token) {
      fetchBorrowings();
    }
  }, [user, token]);

  const fetchBorrowings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/borrowings/my-borrowings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch borrowings');
      }

      const data = await response.json();
      const onlyActive = Array.isArray(data)
        ? data.filter((b: any) => b?.status === 'borrowed' || (b?.status === 'borrowed' && new Date(b?.due_date) < new Date()))
        : [];
      setBorrowings(onlyActive);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your borrowings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (borrowingId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/borrowings/${borrowingId}/return`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to return book');
      }

      toast({
        title: "Success",
        description: "Book returned successfully",
      });

      // Refresh borrowings list
      fetchBorrowings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to return book",
        variant: "destructive",
      });
    } finally {
      setShowReturnDialog(false);
      setReturningId(null);
    }
  };

  const getStatusBadge = (borrowing: Borrowing) => {
    const isOverdue = new Date(borrowing.due_date) < new Date() && borrowing.status === 'borrowed';
    
    if (borrowing.status === 'returned') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs py-0 px-2"><CheckCircle className="w-2 h-2 mr-1" />Returned</Badge>;
    } else if (isOverdue) {
      return <Badge variant="destructive" className="text-xs py-0 px-2"><AlertTriangle className="w-2 h-2 mr-1" />Overdue</Badge>;
    } else {
      return <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs py-0 px-2"><BookOpen className="w-2 h-2 mr-1" />Borrowed</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `${diffDays} days remaining`;
    }
  };

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

  if (loading) {
    return (
      <DashboardLayout userRole="member">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your books...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="member">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
            <p className="text-muted-foreground">
              Manage your borrowed books and track due dates
            </p>
          </div>
        </div>

        {borrowings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No books borrowed yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven&apos;t borrowed any books yet. Visit the catalog to find interesting books!
              </p>
              <Button onClick={() => window.location.href = '/catalog'}>
                Browse Catalog
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {borrowings.map((borrowing) => (
              <Card key={borrowing.id} className="overflow-hidden max-w-[220px] mx-auto cursor-pointer" onClick={() => openDetail(borrowing.books.id)}>
                <div className="aspect-[2/3] relative overflow-hidden">
                  {borrowing.books.cover_url ? (
                    <img
                      src={borrowing.books.cover_url}
                      alt={borrowing.books.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-1 right-1">
                    {getStatusBadge(borrowing)}
                  </div>
                </div>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-base line-clamp-2">{borrowing.books.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">by {borrowing.books.author}</p>
                  {borrowing.books.published_year && (
                    <p className="text-xs text-muted-foreground">{borrowing.books.published_year}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2 py-2">
                  <div className="flex items-center text-xs">
                    <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                    <span>Borrowed: {formatDate(borrowing.borrowed_at)}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                    <span>Due: {formatDate(borrowing.due_date)}</span>
                  </div>
                  {borrowing.status === 'borrowed' && (
                    <p className="text-xs text-muted-foreground">
                      {getDaysRemaining(borrowing.due_date)}
                    </p>
                  )}
                  {borrowing.returned_at && (
                    <div className="flex items-center text-xs">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      <span>Returned: {formatDate(borrowing.returned_at)}</span>
                    </div>
                  )}
                  {borrowing.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      Note: {borrowing.notes}
                    </p>
                  )}
                  {borrowing.status === 'borrowed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs py-1"
                      onClick={() => {
                        setReturningId(borrowing.id);
                        setShowReturnDialog(true);
                      }}
                    >
                      Return Book
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Return Confirmation Dialog */}
        <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Return Book</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to return this book? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => returningId && handleReturnBook(returningId)}
                className="bg-green-600 hover:bg-green-700"
              >
                Return Book
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
