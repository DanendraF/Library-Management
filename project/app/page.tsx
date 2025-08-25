'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Navigation } from '@/components/layout/navigation';

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
  id: string;
  title: string;
  author: string;
  cover: string;
  category: string;
  available: boolean;
  rating: number;
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

export default function Homepage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<UIBook[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);

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
          available: (b.available_copies ?? 0) > 0,
          rating: Number(b.rating ?? 0),
        }));
        setBooks(mapped);

        // Users count (public endpoint with limited fields)
        const users = await api<{ users: any[] }>(`/api/auth/users?limit=200`);
        setUsersCount((users.users || []).length);
      } catch (_e) {
        setBooks([]);
        setCategories([]);
        setUsersCount(0);
      }
    };
    load();
  }, []);

  const categoryList = useMemo(() => ['All', ...categories.map(c => c.name)], [categories]);
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of categories) counts[c.name] = 0;
    for (const b of books) {
      if (counts[b.category] === undefined) counts[b.category] = 0;
      counts[b.category] += 1;
    }
    return counts;
  }, [categories, books]);

  const featuredBooks: UIBook[] = useMemo(() => {
    return books
      .slice()
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);
  }, [books]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const totalBooks = books.length;
  const totalCategories = categories.length;
  const activeMembers = usersCount; // approximate

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Discover Your Next
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {" "}Great Read
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Access thousands of books, manage your reading journey, and connect with a community of book lovers.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search books, authors, genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 py-4 text-lg rounded-full border-2 focus:border-blue-500"
                />
              </div>
              <Button 
                onClick={handleSearch}
                size="lg" 
                className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalBooks}</div>
              <div className="text-gray-600">Books Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{activeMembers}</div>
              <div className="text-gray-600">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{totalCategories}</div>
              <div className="text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">24/7</div>
              <div className="text-gray-600">Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => {
              const count = categoryCounts[category.name] || 0;
              const Icon = BookOpen; // keep a consistent icon
              return (
                <Link key={index} href={`/catalog?category=${encodeURIComponent(category.name)}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-200">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {count} books
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Books</h2>
            <p className="text-lg text-gray-600">Discover our most popular and recommended reads</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredBooks.map((book) => (
              <Card key={book.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative overflow-hidden">
                  <img 
                    src={book.cover} 
                    alt={book.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant={book.available ? "default" : "destructive"}>
                      {book.available ? "Available" : "Borrowed"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${
                          i < Math.floor(book.rating) ? 'bg-yellow-400' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">{book.rating.toFixed(1)}</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{book.title}</h3>
                  <p className="text-gray-600 mb-2">by {book.author}</p>
                  <Badge variant="outline" className="mb-4">{book.category}</Badge>
                  <Button 
                    className="w-full" 
                    variant={book.available ? "default" : "secondary"}
                    disabled={!book.available}
                  >
                    {book.available ? "Borrow Book" : "Currently Unavailable"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/catalog">
              <Button size="lg" variant="outline" className="px-8">
                View All Books
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join Our Library Community Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get access to thousands of books, personalized recommendations, and exclusive member benefits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8">
                Sign Up Now
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">Library Management System</h3>
              <p className="text-gray-400 mb-4">
                Your gateway to knowledge and literary adventures. Discover, borrow, and explore thousands of books.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/catalog" className="hover:text-white transition-colors">Browse Books</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Join Now</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Library Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}