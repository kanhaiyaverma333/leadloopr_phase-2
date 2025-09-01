import { motion } from 'framer-motion';
import {
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  const kpiData: KPIData[] = [
    { title: 'New Leads This Week', value: '147', change: '+23%', trend: 'up', icon: Users, description: 'vs last week', accent: 'border-t-blue-500' },
    { title: 'Qualified Leads', value: '64.2%', change: '+8.1%', trend: 'up', icon: UserCheck, description: 'conversion rate', accent: 'border-t-emerald-500' },
    { title: 'Deals Won', value: '$28,450', change: '+15%', trend: 'up', icon: DollarSign, description: '12 deals closed', accent: 'border-t-amber-500' },
    { title: 'Deals Lost', value: '18', change: '-12%', trend: 'down', icon: TrendingDown, description: 'mostly price sensitive', accent: 'border-t-rose-500' },
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
                      {isPositive ? '▲' : '▼'} {kpi.change}
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