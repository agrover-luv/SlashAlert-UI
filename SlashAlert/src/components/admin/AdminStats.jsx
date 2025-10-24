
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="bg-white/80 backdrop-blur-sm border-neutral-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-600">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-neutral-900">{value}</div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function AdminStats({ stats }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StatCard
        title="Total Users"
        value={stats.totalUsers}
        icon={Users}
        color="text-primary-blue"
      />
      <StatCard
        title="Total Tracked Products"
        value={stats.totalProducts}
        icon={Package}
        color="text-success-green"
      />
      <Link to={createPageUrl("Reviews")}>
        <StatCard
          title="Total Reviews"
          value={stats.totalReviews}
          icon={MessageSquare}
          color="text-warning-amber"
        />
      </Link>
    </div>
  );
}
