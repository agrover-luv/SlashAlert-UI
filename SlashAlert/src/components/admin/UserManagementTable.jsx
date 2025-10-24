
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ArrowUp, ArrowDown, Users } from "lucide-react";
import { format } from 'date-fns';
import UserDetailsModal from './UserDetailsModal';

export default function UserManagementTable({ users, products }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_date', direction: 'desc' });
  const [selectedUser, setSelectedUser] = useState(null);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-200 text-purple-800';
      default:
        return 'bg-neutral-200 text-neutral-800';
    }
  };
  
  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'premium':
        return 'bg-yellow-200 text-yellow-800';
      default:
        return 'bg-green-200 text-green-800';
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowercasedTerm = searchTerm.toLowerCase();
    return users.filter(user =>
      (user.full_name && user.full_name.toLowerCase().includes(lowercasedTerm)) ||
      (user.email && user.email.toLowerCase().includes(lowercasedTerm))
    );
  }, [users, searchTerm]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedUsers = useMemo(() => {
    let sortableItems = [...filteredUsers];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        if (sortConfig.key === 'created_date') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredUsers, sortConfig]);

  const SortableHeader = ({ sortKey, children }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
      <TableHead
        className="font-semibold text-neutral-800 cursor-pointer hover:bg-neutral-100 transition-colors"
        onClick={() => requestSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isSorted && (
            sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />
          )}
        </div>
      </TableHead>
    );
  };

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-neutral-200">
        <CardHeader className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-neutral-900">
              <Users className="w-6 h-6 text-primary-blue" />
              User Management ({users.length})
            </CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 relative">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-neutral-50 shadow-sm">
                <TableRow>
                  <SortableHeader sortKey="full_name">User</SortableHeader>
                  <SortableHeader sortKey="role">Role</SortableHeader>
                  <SortableHeader sortKey="subscription_plan">Subscription Plan</SortableHeader>
                  <SortableHeader sortKey="created_date">Joined Date</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow 
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="cursor-pointer hover:bg-neutral-100/80 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.full_name} className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-neutral-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadge(user.role)}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanBadge(user.subscription_plan)}>{user.subscription_plan || 'free'}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(user.created_date), 'PPP')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <UserDetailsModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        products={products}
      />
    </>
  );
}
