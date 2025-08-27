'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Mail, Phone } from 'lucide-react';

interface BorrowingItem {
  id: string;
  due_date: string;
  borrowed_at: string;
  user_id: string;
  book_id: string;
  users?: { id: string; name?: string; email?: string };
  books?: { id: string; title?: string; author?: string };
}

const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) || 'http://localhost:4000';

export default function LibrarianOverduePage() {
  const { token } = useAuth();
  const [items, setItems] = useState<BorrowingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/borrowings/overdue/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list: BorrowingItem[] = Array.isArray(data) ? data : (data?.borrowings || []);
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  return (
    <DashboardLayout userRole="librarian">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Overdue Books</CardTitle>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Borrowed</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{b?.books?.title || 'Book'}</div>
                      <div className="text-xs text-gray-500">{b?.books?.author || ''}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{b?.users?.name || 'Member'}</div>
                      <div className="text-xs text-gray-500">{b?.users?.email || ''}</div>
                    </TableCell>
                    <TableCell>{new Date(b.borrowed_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(b.due_date).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="destructive">Overdue</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline"><Mail className="h-3 w-3 mr-1" /> Remind</Button>
                      <Button size="sm" variant="outline"><Phone className="h-3 w-3 mr-1" /> Contact</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {items.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">Tidak ada buku yang terlambat 🎉</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


