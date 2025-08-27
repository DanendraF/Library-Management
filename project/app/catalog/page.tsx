'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Grid, List, Star, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Navigation } from '@/components/layout/navigation';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type ApiBook = {
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

type Category = { id: string; name: string };

type UIBook = {
  id: string | number;
  title: string;
  author: string;
  cover: string;
  category: string;
  isbn?: string | null;
  publishedYear: number | 0;
  available: boolean;
  rating: number;
  totalCopies: number;
  availableCopies: number;
  description: string;
};

const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) || 'http://localhost:4000';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...(init || {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

export default function CatalogPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [availability, setAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<UIBook[]>([]);
  const [borrowingBook, setBorrowingBook] = useState<UIBook | null>(null);
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [borrowing, setBorrowing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const cats = await api<{ categories: Category[] }>(`/api/books/categories`);
        setCategories(cats.categories || []);
        const resp = await api<{ books: ApiBook[] }>(`/api/books?limit=500`);
        const byId: Record<string, string> = Object.fromEntries((cats.categories || []).map(c => [c.id, c.name]));
        const mapped: UIBook[] = (resp.books || []).map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          cover: b.cover_url || 'https://images.pexels.com/photos/415071/pexels-photo-415071.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          category: b.category_id ? (byId[b.category_id] || 'Uncategorized') : 'Uncategorized',
          isbn: b.isbn || null,
          publishedYear: b.published_year || 0,
          available: (b.available_copies ?? 0) > 0,
          rating: Number(b.rating ?? 0),
          totalCopies: b.total_copies,
          availableCopies: b.available_copies,
          description: b.description || '',
        }));
        setBooks(mapped);
      } catch (_e) {
        setBooks([]);
      }
    };
    load();
  }, []);

  const categoryOptions = useMemo(() => ['All Categories', ...categories.map((c) => c.name)], [categories]);

  const handleBorrowBook = async () => {
    if (!user || !token || !borrowingBook) {
      toast({
        title: "Authentication Error",
        description: "Please login to borrow books",
        variant: "destructive",
      });
      return;
    }

    try {
      setBorrowing(true);
      const response = await fetch(`${API_BASE}/api/borrowings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          book_id: borrowingBook.id,
          due_date: dueDate,
          notes: ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        // Handle specific authentication errors
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please login again.",
            variant: "destructive",
          });
          // Clear invalid session
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
          return;
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Success",
        description: `Successfully borrowed "${borrowingBook.title}"`,
      });

      // Refresh books to update availability
      const resp = await api<{ books: ApiBook[] }>(`/api/books?limit=500`);
      const byId: Record<string, string> = Object.fromEntries((categories || []).map(c => [c.id, c.name]));
      const mapped: UIBook[] = (resp.books || []).map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        cover: b.cover_url || 'https://images.pexels.com/photos/415071/pexels-photo-415071.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
        category: b.category_id ? (byId[b.category_id] || 'Uncategorized') : 'Uncategorized',
        isbn: b.isbn || null,
        publishedYear: b.published_year || 0,
        available: (b.available_copies ?? 0) > 0,
        rating: Number(b.rating ?? 0),
        totalCopies: b.total_copies,
        availableCopies: b.available_copies,
        description: b.description || '',
      }));
      setBooks(mapped);

      setShowBorrowDialog(false);
      setBorrowingBook(null);
      setDueDate('');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to borrow book',
        variant: "destructive",
      });
    } finally {
      setBorrowing(false);
    }
  };

  const openBorrowDialog = (book: UIBook) => {
    if (!user || !token) {
      toast({
        title: "Login Required",
        description: "Please login to borrow books",
        variant: "destructive",
      });
      return;
    }
    
    // Check if token is valid
    if (!token || token === 'null' || token === 'undefined') {
      toast({
        title: "Authentication Error",
        description: "Please login again to continue",
        variant: "destructive",
      });
      return;
    }
    
    setBorrowingBook(book);
    // Set default due date to 14 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
    setShowBorrowDialog(true);
  };

  const filteredBooks = useMemo(() => {
    let filtered = books.slice();

    if (searchQuery) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }

    if (availability === 'available') {
      filtered = filtered.filter(book => book.available);
    } else if (availability === 'unavailable') {
      filtered = filtered.filter(book => !book.available);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'year':
          return (b.publishedYear || 0) - (a.publishedYear || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [books, searchQuery, selectedCategory, availability, sortBy]);

  const FilterSidebar = ({ isMobile = false }) => (
    <div className={`space-y-6 ${isMobile ? 'p-6' : ''}`}>
      <div>
        <h3 className="font-semibold text-lg mb-4">Filters</h3>
        <Separator className="mb-4" />
      </div>

      <div>
        <h4 className="font-medium mb-3">Category</h4>
        <div className="space-y-2">
          {categoryOptions.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={selectedCategory === category}
                onCheckedChange={() => setSelectedCategory(category)}
              />
              <label htmlFor={category} className="text-sm cursor-pointer">
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Availability</h4>
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Books</SelectItem>
            <SelectItem value="available">Available Only</SelectItem>
            <SelectItem value="unavailable">Currently Borrowed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h4 className="font-medium mb-3">Sort By</h4>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title (A-Z)</SelectItem>
            <SelectItem value="author">Author (A-Z)</SelectItem>
            <SelectItem value="year">Publication Year</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const BookCard = ({ book }: { book: UIBook }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full min-h-[520px] flex flex-col">
      <div className="relative overflow-hidden">
        <img 
          src={book.cover} 
          alt={book.title}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3">
          <Badge variant={book.available ? 'default' : 'destructive'}>
            {book.available ? `${book.availableCopies} Available` : 'Borrowed'}
          </Badge>
        </div>
        <div className="absolute top-3 left-3">
          <div className="flex items-center bg-black/70 text-white px-2 py-1 rounded text-sm">
            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
            {book.rating}
          </div>
        </div>
      </div>
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="mb-2">
          <Badge variant="outline">{book.category}</Badge>
        </div>
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{book.title}</h3>
        <p className="text-gray-600 mb-2 flex items-center">
          <User className="w-4 h-4 mr-1" />
          {book.author}
        </p>
        <p className="text-gray-500 mb-3 flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {book.publishedYear || '-'}
        </p>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{book.description}</p>
        <div className="mt-auto flex gap-2">
          <Button 
            className="flex-1" 
            variant={book.available ? 'default' : 'secondary'}
            disabled={!book.available}
            onClick={() => openBorrowDialog(book)}
          >
            {book.available ? 'Borrow Book' : 'Currently Unavailable'}
          </Button>
          <Button className="flex-1" variant="outline">
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const BookListItem = ({ book }: { book: UIBook }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <img 
            src={book.cover} 
            alt={book.title}
            className="w-20 h-28 object-cover rounded flex-shrink-0"
          />
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">{book.title}</h3>
                <p className="text-gray-600 mb-1">by {book.author}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{book.category}</Badge>
                  <span className="text-sm text-gray-500">{book.publishedYear || '-'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-sm">
                  <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                  {book.rating}
                </div>
                <Badge variant={book.available ? 'default' : 'destructive'}>
                  {book.available ? `${book.availableCopies} Available` : 'Borrowed'}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{book.description}</p>
            <div className="mt-auto flex gap-2">
              <Button 
                className="flex-1"
                size="sm"
                variant={book.available ? 'default' : 'secondary'}
                disabled={!book.available}
                onClick={() => openBorrowDialog(book)}
              >
                {book.available ? 'Borrow Book' : 'Unavailable'}
              </Button>
              <Button className="flex-1" variant="outline" size="sm">
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Book Catalog</h1>
          <p className="text-gray-600">Discover and borrow from our extensive collection</p>
        </div>

        {/* Search and Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search books, authors, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <FilterSidebar isMobile={true} />
                </SheetContent>
              </Sheet>

              {/* View Toggle */}
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredBooks.length} of {books.length} books
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
              <FilterSidebar />
            </div>
          </div>

          {/* Books Display */}
          <div className="flex-1">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No books found matching your criteria.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Categories');
                    setAvailability('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch' 
                  : 'space-y-4'
              }>
                {filteredBooks.map((book) => (
                  viewMode === 'grid' 
                    ? <div key={book.id} className="h-full"><BookCard book={book} /></div>
                    : <BookListItem key={book.id} book={book} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Borrow Book Dialog */}
      <Dialog open={showBorrowDialog} onOpenChange={setShowBorrowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Borrow Book</DialogTitle>
            <DialogDescription>
              {borrowingBook && (
                <div className="mt-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={borrowingBook.cover}
                      alt={borrowingBook.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-semibold">{borrowingBook.title}</h3>
                      <p className="text-sm text-muted-foreground">by {borrowingBook.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {borrowingBook.availableCopies} copies available
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Please select when you plan to return this book
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBorrowDialog(false);
                setBorrowingBook(null);
                setDueDate('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBorrowBook}
              disabled={borrowing || !dueDate}
            >
              {borrowing ? 'Borrowing...' : 'Borrow Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}