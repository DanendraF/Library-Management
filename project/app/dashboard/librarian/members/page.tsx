'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw } from 'lucide-react';

interface MemberItem {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'librarian' | 'member';
  created_at?: string;
}

const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) || 'http://localhost:4000';

export default function LibrarianMembersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/users?limit=200&includeEmail=true`);
      const data = await res.json();
      const list: MemberItem[] = Array.isArray(data?.users) ? data.users : [];
      setMembers(list);
    } catch (_e) {
      toast({ title: 'Gagal memuat member', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [token]);

  const filtered = useMemo(() => {
    if (!query) return members;
    const q = query.toLowerCase();
    return members.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q)
    );
  }, [members, query]);

  return (
    <DashboardLayout userRole="librarian">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Member Info</CardTitle>
            <div className="flex gap-2">
              <Input placeholder="Search member..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <Button variant="outline" onClick={fetchMembers} disabled={loading}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => (window.location.href = `/dashboard/librarian/members/${m.id}`)}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>
                      <Badge variant={m.role === 'member' ? 'secondary' : 'default'}>{m.role}</Badge>
                    </TableCell>
                    <TableCell>{m.created_at ? new Date(m.created_at).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">Tidak ada member</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


