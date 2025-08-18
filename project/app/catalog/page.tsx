'use client';

import { useState, useEffect } from 'react';
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
import Link from 'next/link';

const books = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    cover: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
    category: "Classic Literature",
    isbn: "9780743273565",
    publishedYear: 1925,
    available: true,
    rating: 4.8,
    totalCopies: 5,
    availableCopies: 3,
    description: "A classic American novel set in the summer of 1922."
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    cover: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
    category: "Fiction",
    isbn: "9780061120084",
    publishedYear: 1960,
    available: true,
    rating: 4.9,
    totalCopies: 4,
    availableCopies: 2,
    description: "A gripping tale of racial injustice and childhood innocence."
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    cover: "https://images.pexels.com/photos/415071/pexels-photo-415071.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
    category: "Dystopian",
    isbn: "9780451524935",
    publishedYear: 1949,
    available: false,
    rating: 4.7,
    totalCopies: 3,
    availableCopies: 0,
    description: "A dystopian social science fiction novel."
  },
  {
    id: 4,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    cover: "https://images.pexels.com/photos/694740/pexels-photo-694740.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
    category: "Romance",
    isbn: "9780141439518",
    publishedYear: 1813,
    available: true,
    rating: 4.6,
    totalCopies: 6,
    availableCopies: 4,
    description: "A romantic novel that critiques the British landed gentry."
  },
  {
    id: 5,
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    cover: "https://images.pexels.com/photos/1370294/pexels-photo-1370294.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
    category: "Coming-of-Age",
    isbn: "9780316769174",
    publishedYear: 1951,
    available: true,
    rating: 4.3,
    totalCopies: 4,
    availableCopies: 1,
    description: "A controversial novel about teenage rebellion and alienation."
  },
  {
    id: 6,
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    cover: "https://images.pexels.com/photos/1319854/pexels-photo-1319854.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop",
    category: "Fantasy",
    isbn: "9780439708180",
    publishedYear: 1997,
    available: true,
    rating: 4.9,
    totalCopies: 8,
    availableCopies: 5,
    description: "The beginning of the magical Harry Potter series."
  }
];

const categories = [
  "All Categories",
  "Classic Literature",
  "Fiction",
  "Dystopian",
  "Romance",
  "Coming-of-Age",
  "Fantasy",
  "Science Fiction",
  "Biography",
  "History"
];

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [availability, setAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredBooks, setFilteredBooks] = useState(books);

  useEffect(() => {
    let filtered = books;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }

    // Filter by availability
    if (availability === 'available') {
      filtered = filtered.filter(book => book.available);
    } else if (availability === 'unavailable') {
      filtered = filtered.filter(book => !book.available);
    }

    // Sort books
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'year':
          return b.publishedYear - a.publishedYear;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    setFilteredBooks(filtered);
  }, [searchQuery, selectedCategory, availability, sortBy]);

  const FilterSidebar = ({ isMobile = false }) => (
    <div className={`space-y-6 ${isMobile ? 'p-6' : ''}`}>
      <div>
        <h3 className="font-semibold text-lg mb-4">Filters</h3>
        <Separator className="mb-4" />
      </div>

      <div>
        <h4 className="font-medium mb-3">Category</h4>
        <div className="space-y-2">
          {categories.map((category) => (
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

  const BookCard = ({ book }: { book: typeof books[0] }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative overflow-hidden">
        <img 
          src={book.cover} 
          alt={book.title}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3">
          <Badge variant={book.available ? "default" : "destructive"}>
            {book.available ? `${book.availableCopies} Available` : "Borrowed"}
          </Badge>
        </div>
        <div className="absolute top-3 left-3">
          <div className="flex items-center bg-black/70 text-white px-2 py-1 rounded text-sm">
            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
            {book.rating}
          </div>
        </div>
      </div>
      <CardContent className="p-6">
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
          {book.publishedYear}
        </p>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{book.description}</p>
        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            variant={book.available ? "default" : "secondary"}
            disabled={!book.available}
          >
            {book.available ? "Borrow Book" : "Currently Unavailable"}
          </Button>
          <Button variant="outline" size="sm">
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const BookListItem = ({ book }: { book: typeof books[0] }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <img 
            src={book.cover} 
            alt={book.title}
            className="w-20 h-28 object-cover rounded flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">{book.title}</h3>
                <p className="text-gray-600 mb-1">by {book.author}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{book.category}</Badge>
                  <span className="text-sm text-gray-500">{book.publishedYear}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-sm">
                  <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                  {book.rating}
                </div>
                <Badge variant={book.available ? "default" : "destructive"}>
                  {book.available ? `${book.availableCopies} Available` : "Borrowed"}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{book.description}</p>
            <div className="flex gap-2">
              <Button 
                size="sm"
                variant={book.available ? "default" : "secondary"}
                disabled={!book.available}
              >
                {book.available ? "Borrow Book" : "Unavailable"}
              </Button>
              <Button variant="outline" size="sm">
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
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
              }>
                {filteredBooks.map((book) => (
                  viewMode === 'grid' 
                    ? <BookCard key={book.id} book={book} />
                    : <BookListItem key={book.id} book={book} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}