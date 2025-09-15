'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TimeFilterProvider, useTimeFilter } from '@/components/dashboard/contexts/TimeFilterContext';
import DashboardKPIs from '@/components/dashboard/DashboardKPIs';
import FunnelChart from '@/components/dashboard/FunnelChart';
import LeadSourceChart from '@/components/dashboard/LeadSourceChart';
import ActivityStream from '@/components/dashboard/ActivityStream';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 3,
    },
  },
});

const TimeFilterSelector = () => {
  const { timeframe, setTimeframe } = useTimeFilter();

  return (
    <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
      <TabsList className="glass-card border border-white/10">
        <TabsTrigger value="week" className="text-sm">This Week</TabsTrigger>
        <TabsTrigger value="month" className="text-sm">This Month</TabsTrigger>
        <TabsTrigger value="quarter" className="text-sm">Last 90 Days</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

const DashboardContent = () => {
  const { timeframe } = useTimeFilter();

  const getTitle = () => {
    switch (timeframe) {
      case 'week': return 'This Week\'s Performance';
      case 'month': return 'Monthly Performance';
      case 'quarter': return '90-Day Performance';
      default: return 'Performance Overview';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
      {/* Header with Time Filter */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">{getTitle()}</h2>
        <TimeFilterSelector />
      </div>

      <main className="container py-0 space-y-8">
        {/* KPI Section */}
        <DashboardKPIs />

        {/* Analytics Section - Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-1">
          <FunnelChart />
        </div>
        
        <div className="grid gap-6 lg:grid-cols-1">
          <ActivityStream />
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 lg:grid-cols-1">
          <LeadSourceChart />
        </div>
      </main>

      {/* Ambient Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"
        />
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TimeFilterProvider>
        <DashboardContent />
      </TimeFilterProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default Dashboard;