'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  published_year?: number;
  cover_url?: string;
  description?: string;
  total_copies?: number;
  available_copies?: number;
}

const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) || 'http://localhost:4000';

export default function BookDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/books/${id}`);
      const data = await res.json();
      setBook(data?.book || data || null);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout userRole="member">
        <div className="p-10 text-center text-gray-600">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!book) {
    return (
      <DashboardLayout userRole="member">
        <div className="p-10 text-center text-gray-600">Book not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="member">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <img
            src={book.cover_url || 'https://images.pexels.com/photos/415071/pexels-photo-415071.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
            alt={book.title}
            className="w-full rounded"
          />
        </div>
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{book.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-gray-700">by {book.author}</div>
              <div className="text-sm text-gray-500">ISBN: {book.isbn || '-'}</div>
              {book.published_year && (
                <div className="text-sm text-gray-500">Published: {book.published_year}</div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={book.available_copies ? 'secondary' : 'destructive'}>
                  {book.available_copies ?? 0} available / {book.total_copies ?? 0}
                </Badge>
              </div>
              {book.description && (
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{book.description}</p>
              )}
              <div className="pt-4">
                <Button onClick={() => (window.location.href = '/catalog')}>Back to Catalog</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}


