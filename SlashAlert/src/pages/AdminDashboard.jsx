
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Product } from '@/api/entities';
import { Review } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import AdminStats from "../components/admin/AdminStats";
import UserManagementTable from "../components/admin/UserManagementTable";
import AllProductsTable from "../components/admin/AllProductsTable";
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalReviews: 0 });
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser.role !== 'admin') {
          // If not an admin, redirect to the regular dashboard
          navigate(createPageUrl("Dashboard"));
          return;
        }

        // Fetch all data for the dashboard
        const [allUsers, allProducts, allReviews] = await Promise.all([
          User.list(),
          Product.list(),
          Review.list(),
        ]);

        setUsers(allUsers);
        setProducts(allProducts);
        setStats({
          totalUsers: allUsers.length,
          totalProducts: allProducts.length,
          totalReviews: allReviews.length,
        });

      } catch (error) {
        // If user is not logged in, redirect
        console.error("Auth error or data fetch error:", error);
        navigate(createPageUrl("Dashboard"));
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-neutral-900 flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-primary-blue" />
            Admin Dashboard
          </h1>
          <p className="text-neutral-600 mt-1">System-wide overview and management.</p>
        </motion.div>

        <AdminStats stats={stats} />

        <UserManagementTable users={users} products={products} />
        
        <AllProductsTable products={products} users={users} />

      </div>
    </div>
  );
}
