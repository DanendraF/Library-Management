'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'librarian' | 'member';
  created_at?: string;
}

interface BorrowingItem {
  id: string;
  borrowed_at: string;
  due_date: string;
  returned_at?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  books?: { id: string; title?: string; author?: string };
}

const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) || 'http://localhost:4000';

export default function MemberDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [borrowings, setBorrowings] = useState<BorrowingItem[]>([]);
  const userId = String(params?.id || '');

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const [uRes, bRes] = await Promise.all([
          fetch(`${API_BASE}/api/auth/users/${userId}?includeEmail=true`),
          fetch(`${API_BASE}/api/borrowings?user_id=${userId}`, {
            headers: { 'Authorization': `Bearer ${(typeof window !== 'undefined' && localStorage.getItem('auth_token')) || ''}` },
          }),
        ]);

        const uJson = await uRes.json();
        const bJson = await bRes.json();

        setProfile(uJson?.user || null);
        const list: BorrowingItem[] = Array.isArray(bJson) ? bJson : (bJson?.borrowings || []);
        setBorrowings(list);
      } catch (_e) {
        toast({ title: 'Gagal memuat detail member', variant: 'destructive' });
      }
    };

    fetchData();
  }, [userId]);

  return (
    <DashboardLayout userRole="librarian">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Member Detail</h1>
          <Link href="/dashboard/librarian/members"><Button variant="outline">Back to Members</Button></Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {profile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="font-medium">{profile.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{profile.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Role</div>
                  <div className="mt-1"><Badge variant={profile.role === 'member' ? 'secondary' : 'default'}>{profile.role}</Badge></div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-medium">{profile.created_at ? new Date(profile.created_at).toLocaleString() : '-'}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading profile...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Borrowings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Borrowed At</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {borrowings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{b?.books?.title || 'Book'}</div>
                      <div className="text-xs text-gray-500">{b?.books?.author}</div>
                    </TableCell>
                    <TableCell>{new Date(b.borrowed_at).toLocaleString()}</TableCell>
                    <TableCell>{new Date(b.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'returned' ? 'default' : b.status === 'overdue' ? 'destructive' : 'secondary'}>{b.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {borrowings.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">Belum ada peminjaman</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
