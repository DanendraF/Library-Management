'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { CheckCircle, RefreshCcw } from 'lucide-react';

type BorrowStatus = 'borrowed' | 'returned' | 'overdue';

interface BorrowingItem {
  id: string;
  user_id: string;
  book_id: string;
  borrowed_at: string;
  due_date: string;
  returned_at?: string;
  status: BorrowStatus;
  users?: { id: string; name?: string; email?: string };
  books?: { id: string; title?: string; author?: string; isbn?: string };
}

const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) || 'http://localhost:4000';

export default function LibrarianTransactionsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<BorrowingItem[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | BorrowStatus>('all');
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const url = `${API_BASE}/api/borrowings${status === 'all' ? '' : `?status=${status}`}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const list: BorrowingItem[] = Array.isArray(data) ? data : (data?.borrowings || []);
      setTransactions(list);
    } catch (_e) {
      toast({ title: 'Gagal memuat transaksi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token, status]);

  const filtered = useMemo(() => {
    if (!query) return transactions;
    const q = query.toLowerCase();
    return transactions.filter(t =>
      (t?.users?.name || '').toLowerCase().includes(q) ||
      (t?.users?.email || '').toLowerCase().includes(q) ||
      (t?.books?.title || '').toLowerCase().includes(q) ||
      (t?.books?.author || '').toLowerCase().includes(q)
    );
  }, [transactions, query]);

  const handleReturn = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/borrowings/${id}/return`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || 'Gagal mengembalikan buku');
      }
      toast({ title: 'Buku dikembalikan' });
      fetchTransactions();
    } catch (e: any) {
      toast({ title: 'Gagal mengembalikan buku', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout userRole="librarian">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <div className="flex gap-2">
              <Input placeholder="Search user or book..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="borrowed">Borrowed</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Borrowed At</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t?.users?.name || 'Member'}</div>
                      <div className="text-xs text-gray-500">{t?.users?.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{t?.books?.title || 'Book'}</div>
                      <div className="text-xs text-gray-500">{t?.books?.author}</div>
                    </TableCell>
                    <TableCell>{new Date(t.borrowed_at).toLocaleString()}</TableCell>
                    <TableCell>{new Date(t.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'returned' ? 'default' : t.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {t.status !== 'returned' ? (
                        <Button size="sm" onClick={() => handleReturn(t.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Return
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">No action</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">Tidak ada transaksi</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


