'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Search, BookOpen, AlertCircle, Star, CheckCircle, User, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useToast } from '@/hooks/use-toast';

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

export default function MemberDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);

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
      setBorrowings(data);
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

  const calculateDaysLeft = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (borrowing: Borrowing) => {
    const isOverdue = new Date(borrowing.due_date) < new Date() && borrowing.status === 'borrowed';
    
    if (borrowing.status === 'returned') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Returned</Badge>;
    } else if (isOverdue) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
    } else {
      return <Badge variant="default" className="bg-blue-100 text-blue-800"><BookOpen className="w-3 h-3 mr-1" />Borrowed</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalFines = borrowings
    .filter(borrowing => {
      const isOverdue = new Date(borrowing.due_date) < new Date() && borrowing.status === 'borrowed';
      return isOverdue;
    })
    .reduce((total, borrowing) => {
      const daysOverdue = Math.abs(calculateDaysLeft(borrowing.due_date));
      return total + (daysOverdue * 0.50); // $0.50 per day
    }, 0);

  const activeBorrowings = borrowings.filter(borrowing => borrowing.status === 'borrowed');
  const overdueBooks = borrowings.filter(borrowing => {
    const isOverdue = new Date(borrowing.due_date) < new Date() && borrowing.status === 'borrowed';
    return isOverdue;
  });
  const completedBooks = borrowings.filter(borrowing => borrowing.status === 'returned').length;

  if (loading) {
    return (
      <DashboardLayout userRole="member">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="member">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-blue-100 mb-6">Continue your reading journey</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{activeBorrowings.length}</div>
              <div className="text-blue-100">Books Borrowed</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{completedBooks}</div>
              <div className="text-blue-100">Books Completed</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">${totalFines.toFixed(2)}</div>
              <div className="text-blue-100">Outstanding Fines</div>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              My Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">January 2024</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Reading Level</p>
                    <p className="font-medium">Active Reader</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search for books to borrow..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => window.location.href = '/catalog'}>Search Catalog</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Currently Borrowed Books */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Currently Borrowed ({activeBorrowings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeBorrowings.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No books borrowed</h3>
                    <p className="text-gray-600 mb-4">Start your reading journey by borrowing books from our catalog</p>
                    <Button onClick={() => window.location.href = '/catalog'}>
                      Browse Catalog
                    </Button>
                  </div>
                ) : (
                  activeBorrowings.map((borrowing) => {
                    const daysLeft = calculateDaysLeft(borrowing.due_date);
                    const isOverdue = daysLeft < 0;
                    
                  return (
                      <div key={borrowing.id} className="flex gap-4 p-4 border rounded-lg">
                      <img
                          src={borrowing.books.cover_url || 'https://images.pexels.com/photos/415071/pexels-photo-415071.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
                          alt={borrowing.books.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">{borrowing.books.title}</h3>
                          <p className="text-gray-600 mb-2">by {borrowing.books.author}</p>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                              Due: {formatDate(borrowing.due_date)}
                          </span>
                            {isOverdue ? (
                            <Badge variant="destructive" className="ml-2">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {Math.abs(daysLeft)} days overdue
                            </Badge>
                          ) : (
                            <Badge variant={daysLeft <= 3 ? "secondary" : "default"} className="ml-2">
                              <Clock className="h-3 w-3 mr-1" />
                              {daysLeft} days left
                            </Badge>
                          )}
                        </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Renew
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/member/borrowed'}>
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Overdue Books */}
            {overdueBooks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    Overdue Books ({overdueBooks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {overdueBooks.map((borrowing) => {
                    const daysOverdue = Math.abs(calculateDaysLeft(borrowing.due_date));
                    return (
                      <div key={borrowing.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <h4 className="font-medium text-sm mb-1">{borrowing.books.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">by {borrowing.books.author}</p>
                        <Badge variant="destructive" className="text-xs">
                          {daysOverdue} days overdue
                        </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/catalog'}>
                  <Search className="h-4 w-4 mr-2" />
                  Browse Catalog
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/member/borrowed'}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  My Books
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Reading History
                </Button>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Reading Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Books Read This Month</span>
                  <span className="font-semibold">{completedBooks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Reading Time</span>
                  <span className="font-semibold">2.5 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Favorite Genre</span>
                  <span className="font-semibold">Fiction</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}