'use client';

import { useState } from 'react';
import { Calendar, Clock, Search, BookOpen, AlertCircle, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const borrowedBooks = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    cover: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
    borrowDate: "2024-01-15",
    dueDate: "2024-02-15",
    status: "borrowed",
    renewalsLeft: 1,
    progress: 65
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    cover: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
    borrowDate: "2024-01-08",
    dueDate: "2024-02-08",
    status: "overdue",
    renewalsLeft: 0,
    progress: 45
  },
  {
    id: 3,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    cover: "https://images.pexels.com/photos/694740/pexels-photo-694740.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
    borrowDate: "2024-01-20",
    dueDate: "2024-02-20",
    status: "borrowed",
    renewalsLeft: 2,
    progress: 30
  }
];

const readingHistory = [
  {
    id: 1,
    title: "1984",
    author: "George Orwell",
    completedDate: "2024-01-05",
    rating: 5
  },
  {
    id: 2,
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    completedDate: "2023-12-20",
    rating: 4
  }
];

const recommendations = [
  {
    id: 1,
    title: "Brave New World",
    author: "Aldous Huxley",
    cover: "https://images.pexels.com/photos/415071/pexels-photo-415071.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
    reason: "Based on your interest in dystopian fiction"
  },
  {
    id: 2,
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    cover: "https://images.pexels.com/photos/1370294/pexels-photo-1370294.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
    reason: "Similar to Pride and Prejudice"
  }
];

export default function MemberDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const calculateDaysLeft = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRenewBook = (bookId: number) => {
    // Implement renewal logic
    console.log(`Renewing book ${bookId}`);
  };

  const totalFines = borrowedBooks
    .filter(book => book.status === 'overdue')
    .reduce((total, book) => {
      const overdueDays = Math.abs(calculateDaysLeft(book.dueDate));
      return total + (overdueDays * 1); // $1 per day
    }, 0);

  return (
    <DashboardLayout userRole="member">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-blue-100 mb-6">Continue your reading journey</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{borrowedBooks.length}</div>
              <div className="text-blue-100">Books Borrowed</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{readingHistory.length}</div>
              <div className="text-blue-100">Books Completed</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">${totalFines}</div>
              <div className="text-blue-100">Outstanding Fines</div>
            </div>
          </div>
        </div>

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
              <Button>Search Catalog</Button>
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
                  Currently Borrowed ({borrowedBooks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {borrowedBooks.map((book) => {
                  const daysLeft = calculateDaysLeft(book.dueDate);
                  return (
                    <div key={book.id} className="flex gap-4 p-4 border rounded-lg">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{book.title}</h3>
                        <p className="text-gray-600 mb-2">by {book.author}</p>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Due: {new Date(book.dueDate).toLocaleDateString()}
                          </span>
                          {book.status === 'overdue' ? (
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

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Reading Progress</span>
                            <span>{book.progress}%</span>
                          </div>
                          <Progress value={book.progress} className="h-2" />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRenewBook(book.id)}
                            disabled={book.renewalsLeft === 0}
                          >
                            Renew ({book.renewalsLeft} left)
                          </Button>
                          <Button size="sm" variant="outline">
                            Mark Progress
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Reading History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Recently Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {readingHistory.map((book) => (
                    <div key={book.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{book.title}</h4>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                        <p className="text-xs text-gray-500">
                          Completed: {new Date(book.completedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < book.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Membership Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Books Limit</span>
                  <span className="font-medium">5 books</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Current Borrowed</span>
                  <span className="font-medium">{borrowedBooks.length}/5</span>
                </div>
                {totalFines > 0 && (
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-800">Outstanding Fines</span>
                    <span className="font-bold text-red-800">${totalFines}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.map((book) => (
                  <div key={book.id} className="space-y-3">
                    <div className="flex gap-3">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{book.title}</h4>
                        <p className="text-xs text-gray-600">{book.author}</p>
                        <p className="text-xs text-blue-600 mt-1">{book.reason}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}