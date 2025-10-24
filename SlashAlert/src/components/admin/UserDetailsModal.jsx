
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { User, Package, DollarSign, Calendar, Search, ArrowUp, ArrowDown } from "lucide-react";
import { format, formatDistanceToNow } from 'date-fns';

const formatNumberWithCommas = (number) => {
  if (typeof number !== 'number' || isNaN(number)) return '0.00';
  return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className={`flex items-start gap-3 p-3 rounded-lg bg-opacity-10 ${color.bg}`}>
    <div className={`p-2 rounded-full ${color.iconBg}`}>
      <Icon className={`w-5 h-5 ${color.iconText}`} />
    </div>
    <div>
      <p className="text-sm text-neutral-600">{title}</p>
      <p className="text-lg font-bold text-neutral-900">{value}</p>
    </div>
  </div>
);

export default function UserDetailsModal({ isOpen, onClose, user, products }) {
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSortConfig, setProductSortConfig] = useState({ key: 'name', direction: 'asc' });

  // userProducts must be defined always, so handle 'user' being null inside the memo
  const userProducts = useMemo(() => {
    if (!user) return [];
    return products.filter(p => p.created_by === user.email);
  }, [products, user]); // Changed dependency from user.email to user

  const filteredUserProducts = useMemo(() => {
    if (!productSearchTerm) return userProducts;
    return userProducts.filter(p =>
      p.name.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [userProducts, productSearchTerm]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (productSortConfig.key === key && productSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setProductSortConfig({ key, direction });
  };

  const sortedUserProducts = useMemo(() => {
    let sortableItems = [...filteredUserProducts];
    if (productSortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[productSortConfig.key] === undefined ? (productSortConfig.key.includes('price') ? 0 : '') : a[productSortConfig.key];
        const bValue = b[productSortConfig.key] === undefined ? (productSortConfig.key.includes('price') ? 0 : '') : b[productSortConfig.key];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            if (aValue < bValue) return productSortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return productSortConfig.direction === 'asc' ? 1 : -1;
        } else {
            // Treat boolean values as numbers for consistent sorting (false = 0, true = 1)
            const valA = typeof aValue === 'boolean' ? (aValue ? 1 : 0) : String(aValue).toLowerCase();
            const valB = typeof bValue === 'boolean' ? (bValue ? 1 : 0) : String(bValue).toLowerCase();
            if (valA < valB) return productSortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return productSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredUserProducts, productSortConfig]);

  // All hooks must be called unconditionally at the top level.
  // Calculations that depend on `user` properties directly should happen after the null check.
  if (!user) return null;

  const membershipDuration = formatDistanceToNow(new Date(user.created_date), { addSuffix: true });
  const totalValueTracked = userProducts.reduce((sum, p) => sum + (p.original_price || 0), 0);
  const lifetimeSavings = userProducts.reduce((sum, product) => {
    const saving = (product.original_price || 0) - (product.current_price || 0);
    return saving > 0 ? sum + saving : sum; // Only count positive savings
  }, 0);

  const SortableHeader = ({ sortKey, children }) => {
    const isSorted = productSortConfig.key === sortKey;
    return (
      <TableHead className="cursor-pointer hover:bg-neutral-50" onClick={() => requestSort(sortKey)}>
        <div className="flex items-center gap-1">
          {children}
          {isSorted ? (productSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : null}
        </div>
      </TableHead>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-white/90 backdrop-blur-sm p-4">
        <DialogHeader className="mb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.full_name} className="w-16 h-16 rounded-full border-2 border-primary-blue" />
              <div>
                <DialogTitle className="text-2xl font-bold text-neutral-900">{user.full_name}</DialogTitle>
                <DialogDescription className="text-neutral-600">{user.email}</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 mr-8 mt-1">
              <Badge variant="secondary" className={user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-neutral-100 text-neutral-800'}>{user.role}</Badge>
              <Badge variant="secondary" className={(user.subscription_plan || 'free') === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>{user.subscription_plan || 'free'}</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <StatCard
            icon={Calendar}
            title="Member Since"
            value={format(new Date(user.created_date), 'MMM d, yyyy')}
            color={{bg: "bg-blue-100", iconBg: "bg-blue-200", iconText: "text-blue-600"}}
          />
          <StatCard
            icon={User}
            title="Membership Duration"
            value={membershipDuration}
            color={{bg: "bg-sky-100", iconBg: "bg-sky-200", iconText: "text-sky-600"}}
          />
          <StatCard
            icon={Package}
            title="Products Tracked"
            value={userProducts.length}
            color={{bg: "bg-green-100", iconBg: "bg-green-200", iconText: "text-green-600"}}
          />
          <StatCard
            icon={DollarSign}
            title="Total Value Tracked"
            value={`$${formatNumberWithCommas(totalValueTracked)}`}
            color={{bg: "bg-indigo-100", iconBg: "bg-indigo-200", iconText: "text-indigo-600"}}
          />
          <StatCard
            icon={DollarSign}
            title="Lifetime Savings"
            value={`$${formatNumberWithCommas(lifetimeSavings)}`}
            color={{bg: "bg-emerald-100", iconBg: "bg-emerald-200", iconText: "text-emerald-600"}}
          />
        </div>

        <Card>
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-neutral-600" />
              Products Tracked by {user.full_name}
            </CardTitle>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="overflow-y-auto max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader sortKey="name">Product</SortableHeader>
                    <SortableHeader sortKey="original_price">Original Price</SortableHeader>
                    <SortableHeader sortKey="current_price">Current Price</SortableHeader>
                    <SortableHeader sortKey="is_active">Status</SortableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUserProducts.length > 0 ? sortedUserProducts.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary-blue hover:text-primary-blue/80 hover:underline line-clamp-1 block"
                          title={product.name}
                        >
                          {product.name}
                        </a>
                      </TableCell>
                      <TableCell>${formatNumberWithCommas(product.original_price)}</TableCell>
                      <TableCell>${formatNumberWithCommas(product.current_price)}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? 'secondary' : 'outline'} className={product.is_active ? 'bg-green-100 text-green-800' : ''}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-neutral-500 py-8">
                        {productSearchTerm ? 'No products match your search.' : 'No products tracked by this user.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
