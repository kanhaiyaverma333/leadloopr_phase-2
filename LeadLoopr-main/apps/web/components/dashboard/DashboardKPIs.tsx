import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserCheck,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useDashboardMetrics } from '@/lib/hooks/useLeadsData';

interface KPIData {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  description?: string;
  accent: string; // e.g., border-t-blue-500
}

const DashboardKPIs = () => {
  const { metrics, isLoading, error } = useDashboardMetrics();

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Performance Overview</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading metrics...
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-card border-white/20 animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 w-8 bg-muted rounded-lg"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Performance Overview</h2>
          <div className="text-red-500 text-sm">Failed to load metrics</div>
        </div>
        
        <Card className="glass-card border-red-500/20">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p>Unable to load dashboard metrics.</p>
              <p className="text-sm text-muted-foreground mt-1">Please check your connection and try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No metrics available
  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Performance Overview</h2>
        </div>
        
        <Card className="glass-card border-white/20">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>No data available yet.</p>
              <p className="text-sm mt-1">Start by adding some leads to see your performance metrics.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpiData: KPIData[] = [
    { 
      title: 'New Leads This Week', 
      value: metrics.newLeadsThisWeek.toString(), 
      change: metrics.newLeadsChange, 
      trend: metrics.newLeadsChangePositive ? 'up' : 'down', 
      icon: Users, 
      description: 'vs last week', 
      accent: 'border-t-blue-500' 
    },
    { 
      title: 'Qualified Leads', 
      value: metrics.qualificationRate, 
      change: metrics.qualificationChange, 
      trend: metrics.qualificationChangePositive ? 'up' : 'down', 
      icon: UserCheck, 
      description: 'conversion rate', 
      accent: 'border-t-emerald-500' 
    },
    { 
      title: 'Deals Won', 
      value: metrics.thisWeekRevenue > 0 ? `$${metrics.thisWeekRevenue.toLocaleString()}` : '$0', 
      change: metrics.revenueChange, 
      trend: metrics.revenueChangePositive ? 'up' : 'down', 
      icon: DollarSign, 
      description: `${metrics.wonDealsCount} deals closed`, 
      accent: 'border-t-amber-500' 
    },
    { 
      title: 'Deals Lost', 
      value: metrics.lostDealsThisWeek.toString(), 
      change: metrics.lostDealsChange, 
      trend: metrics.lostDealsChangePositive ? 'up' : 'down', 
      icon: TrendingDown, 
      description: 'this week', 
      accent: 'border-t-rose-500' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Overview</h2>
        <Tabs defaultValue="week" className="w-auto">
          <TabsList className="glass-card border border-white/10">
            <TabsTrigger value="week" className="text-sm">This Week</TabsTrigger>
            <TabsTrigger value="month" className="text-sm">This Month</TabsTrigger>
            <TabsTrigger value="quarter" className="text-sm">Last 90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === 'up';

          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`glass-card border-white/20 hover:border-white/30 transition-all duration-300 bg-card/70 backdrop-saturate-[1.2] border-t-4 ${kpi.accent}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground/90">
                    {kpi.title}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-muted/60 border border-border">
                    <Icon className="h-4 w-4 text-foreground/80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">{kpi.value}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                      {isPositive ? 'â–²' : 'â–¼'} {kpi.change}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {kpi.description}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardKPIs;