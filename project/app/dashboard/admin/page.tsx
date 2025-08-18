'use client';

import { useState } from 'react';
import { Users, BookOpen, TrendingUp, AlertCircle, DollarSign, Activity, UserPlus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const systemStats = {
  totalUsers: 2547,
  totalBooks: 15420,
  activeLoans: 1234,
  overdueBooks: 89,
  totalFines: 2340,
  monthlyRevenue: 15600
};

const recentActivities = [
  {
    id: 1,
    type: 'user_registration',
    description: 'New member registered: Alice Johnson',
    timestamp: '2024-01-25 14:30',
    icon: UserPlus
  },
  {
    id: 2,
    type: 'book_added',
    description: 'New book added to catalog: "The Silent Patient"',
    timestamp: '2024-01-25 13:15',
    icon: BookOpen
  },
  {
    id: 3,
    type: 'system_alert',
    description: 'Storage capacity at 85%',
    timestamp: '2024-01-25 12:00',
    icon: AlertCircle
  }
];

const topBooks = [
  { title: 'The Great Gatsby', borrows: 156, category: 'Classic Literature' },
  { title: 'Harry Potter Series', borrows: 134, category: 'Fantasy' },
  { title: 'To Kill a Mockingbird', borrows: 98, category: 'Fiction' },
  { title: '1984', borrows: 87, category: 'Dystopian' },
  { title: 'Pride and Prejudice', borrows: 76, category: 'Romance' }
];

const userGrowth = [
  { month: 'Jan', members: 2100, librarians: 45 },
  { month: 'Feb', members: 2200, librarians: 47 },
  { month: 'Mar', members: 2350, librarians: 50 },
  { month: 'Apr', members: 2450, librarians: 52 },
  { month: 'May', members: 2547, librarians: 55 }
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-purple-100 mb-6">Welcome back, {user?.name}. Here's your system overview.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
              <div className="text-purple-100">Total Users</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{systemStats.totalBooks.toLocaleString()}</div>
              <div className="text-purple-100">Total Books</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{systemStats.activeLoans.toLocaleString()}</div>
              <div className="text-purple-100">Active Loans</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{systemStats.overdueBooks}</div>
              <div className="text-purple-100">Overdue</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">${systemStats.totalFines.toLocaleString()}</div>
              <div className="text-purple-100">Fines</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">${systemStats.monthlyRevenue.toLocaleString()}</div>
              <div className="text-purple-100">Revenue</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Manage Users</h3>
              <Button className="w-full">View Users</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Book Management</h3>
              <Button className="w-full">Manage Books</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">View Reports</h3>
              <Button className="w-full">Generate Reports</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">System Settings</h3>
              <Button className="w-full">Configure</Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent System Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent System Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Most Popular Books */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Most Popular Books
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topBooks.map((book, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{book.title}</h4>
                      <p className="text-xs text-gray-500">{book.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{book.borrows} borrows</div>
                      <Progress value={(book.borrows / 156) * 100} className="w-20 h-2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Outstanding Fines</span>
                  <span className="font-semibold">${systemStats.totalFines.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Revenue</span>
                  <span className="font-semibold text-green-600">${systemStats.monthlyRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Collection Rate</span>
                  <Badge variant="default">94%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">89 overdue books</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Storage 85% full</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">System backup completed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                User Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Members</span>
                    <span className="font-semibold">2,492</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Librarians</span>
                    <span className="font-semibold">55</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Monthly Growth</span>
                  <Badge variant="default">+12.5%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}