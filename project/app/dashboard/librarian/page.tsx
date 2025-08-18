'use client';

import { useState } from 'react';
import { BookOpen, Users, TrendingUp, AlertCircle, Clock, CheckCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const recentTransactions = [
  {
    id: 1,
    type: 'borrow',
    member: 'John Doe',
    book: 'The Great Gatsby',
    date: '2024-01-25',
    status: 'completed'
  },
  {
    id: 2,
    type: 'return',
    member: 'Jane Smith',
    book: 'To Kill a Mockingbird',
    date: '2024-01-24',
    status: 'completed'
  },
  {
    id: 3,
    type: 'borrow',
    member: 'Mike Johnson',
    book: 'Pride and Prejudice',
    date: '2024-01-24',
    status: 'pending'
  }
];

const overdueBooks = [
  {
    id: 1,
    title: '1984',
    member: 'Alice Brown',
    dueDate: '2024-01-20',
    daysOverdue: 5,
    memberEmail: 'alice@email.com'
  },
  {
    id: 2,
    title: 'Brave New World',
    member: 'Bob Wilson',
    dueDate: '2024-01-18',
    daysOverdue: 7,
    memberEmail: 'bob@email.com'
  }
];

export default function LibrarianDashboard() {
  const { user } = useAuth();
  const [quickSearch, setQuickSearch] = useState('');

  return (
    <DashboardLayout userRole="librarian">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
          <p className="text-emerald-100 mb-6">Manage your library operations efficiently</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">1,247</div>
              <div className="text-emerald-100">Total Books</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">89</div>
              <div className="text-emerald-100">Books Borrowed</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">12</div>
              <div className="text-emerald-100">Overdue Books</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">456</div>
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
              <Button className="w-full">Add Book</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Process Returns</h3>
              <p className="text-gray-600 mb-4">Handle book returns and renewals</p>
              <Button className="w-full">Process Returns</Button>
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
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'borrow' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {transaction.type === 'borrow' ? (
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.member}</p>
                        <p className="text-sm text-gray-600">{transaction.book}</p>
                        <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                  </div>
                ))}
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
                {overdueBooks.map((book) => (
                  <div key={book.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{book.title}</h4>
                        <p className="text-sm text-gray-600">{book.member}</p>
                        <p className="text-xs text-gray-500">{book.memberEmail}</p>
                      </div>
                      <Badge variant="destructive">
                        {book.daysOverdue} days overdue
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        Send Reminder
                      </Button>
                      <Button size="sm" variant="outline">
                        Contact Member
                      </Button>
                    </div>
                  </div>
                ))}
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
              {[
                { title: 'The Great Gatsby', borrows: 15 },
                { title: 'To Kill a Mockingbird', borrows: 13 },
                { title: 'Pride and Prejudice', borrows: 11 }
              ].map((book, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{book.title}</h4>
                    <Badge variant="secondary">{book.borrows} borrows</Badge>
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