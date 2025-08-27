'use client';

import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Users, TrendingUp, AlertCircle, Clock, CheckCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useToast } from '@/hooks/use-toast';

interface BorrowingItem {
  id: string;
  borrowed_at: string;
  due_date: string;
  returned_at?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  users?: { id: string; name?: string; email?: string; role?: string };
  books?: { id: string; title?: string; author?: string };
}

export default function LibrarianDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [quickSearch, setQuickSearch] = useState('');

  const [totalBooks, setTotalBooks] = useState(0);
  const [borrowedCount, setBorrowedCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);

  const [recentTransactions, setRecentTransactions] = useState<BorrowingItem[]>([]);
  const [overdueBooks, setOverdueBooks] = useState<BorrowingItem[]>([]);

  const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) || 'http://localhost:4000';

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        // Books list for total count
        const booksRes = await fetch(`${API_BASE}/api/books?limit=1000`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const booksJson = await booksRes.json().catch(() => ({}));
        const booksArr = Array.isArray(booksJson?.books) ? booksJson.books : [];
        setTotalBooks(booksArr.length);

        // Borrowing stats
        const statsRes = await fetch(`${API_BASE}/api/borrowings/stats/overview`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setBorrowedCount(Number(stats?.borrowed ?? 0));
          setOverdueCount(Number(stats?.overdue ?? 0));
        }

        // All current borrowings (to compute active members) and recent list
        const allRes = await fetch(`${API_BASE}/api/borrowings`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (allRes.ok) {
          const all = await allRes.json();
          const list: BorrowingItem[] = Array.isArray(all) ? all : (all?.borrowings || []);
          // Sort by borrowed_at desc and pick top 6 for recent
          const recent = list
            .slice()
            .sort((a, b) => new Date(b.borrowed_at).getTime() - new Date(a.borrowed_at).getTime())
            .slice(0, 6);
          setRecentTransactions(recent);
          const uniqueActiveUsers = new Set(
            list.filter(b => b.status === 'borrowed').map(b => b?.users?.id || 'unknown')
          );
          setActiveMembers(Math.max(0, uniqueActiveUsers.has('unknown') ? uniqueActiveUsers.size - 1 : uniqueActiveUsers.size));
        }

        // Overdue list
        const overdueRes = await fetch(`${API_BASE}/api/borrowings/overdue/list`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (overdueRes.ok) {
          const overdue = await overdueRes.json();
          const list: BorrowingItem[] = Array.isArray(overdue) ? overdue : (overdue?.borrowings || []);
          setOverdueBooks(list);
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load librarian data', variant: 'destructive' });
      }
    };

    fetchData();
  }, [token]);

  return (
    <DashboardLayout userRole="librarian">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
          <p className="text-emerald-100 mb-6">Manage your library operations efficiently</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{totalBooks}</div>
              <div className="text-emerald-100">Total Books</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{borrowedCount}</div>
              <div className="text-emerald-100">Books Borrowed</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{overdueCount}</div>
              <div className="text-emerald-100">Overdue Books</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{activeMembers}</div>
              <div className="text-emerald-100">Active Members</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Add New Book</h3>
              <p className="text-gray-600 mb-4">Add a new book to the catalog</p>
              <Button className="w-full" onClick={() => (window.location.href = '/dashboard/librarian/books')}>Add Book</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Process Returns</h3>
              <p className="text-gray-600 mb-4">Handle book returns and renewals</p>
              <Button className="w-full" onClick={() => (window.location.href = '/dashboard/librarian/transactions')}>Process Returns</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Member Search</h3>
              <p className="text-gray-600 mb-4">Find and manage member accounts</p>
              <Button className="w-full">Search Members</Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length === 0 ? (
                  <div className="text-sm text-gray-500">No recent transactions</div>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.status === 'returned' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {transaction.status === 'returned' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction?.users?.name || 'Member'}</p>
                          <p className="text-sm text-gray-600">{transaction?.books?.title || 'Book'}</p>
                          <p className="text-xs text-gray-500">{new Date(transaction.borrowed_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant={transaction.status === 'returned' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Books */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Overdue Books ({overdueBooks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overdueBooks.length === 0 ? (
                  <div className="text-sm text-gray-500">No overdue books 🎉</div>
                ) : (
                  overdueBooks.map((b) => {
                    const daysOverdue = Math.max(0, Math.ceil((Date.now() - new Date(b.due_date).getTime()) / (1000 * 60 * 60 * 24)));
                    return (
                      <div key={b.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{b?.books?.title || 'Unknown title'}</h4>
                            <p className="text-sm text-gray-600">{b?.users?.name || 'Member'}</p>
                            <p className="text-xs text-gray-500">{b?.users?.email || ''}</p>
                          </div>
                          <Badge variant="destructive">{daysOverdue} days overdue</Badge>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">Send Reminder</Button>
                          <Button size="sm" variant="outline">Contact Member</Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Book Search */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Book Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Search books by title, author, or ISBN..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="flex-1"
              />
              <Button>Search</Button>
              <Button variant="outline">Advanced Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Popular Books This Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Popular Books This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentTransactions.slice(0, 3).map((b, index) => (
                <div key={b.id || index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{b?.books?.title || 'Book'}</h4>
                    <Badge variant="secondary">{b.status === 'returned' ? 'returned' : 'borrowed'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}