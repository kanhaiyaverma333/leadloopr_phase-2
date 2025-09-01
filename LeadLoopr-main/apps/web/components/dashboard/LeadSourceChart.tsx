import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SourceData {
  name: string;
  leads: number;
  won: number;
  lost: number;
  winRate: number;
  trend: 'up' | 'down';
  trendValue: string;
  color: string;
  icon: string;
}

const LeadSourceChart = () => {
  const sourceData: SourceData[] = [
    {
      name: "Google Ads",
      leads: 89,
      won: 18,
      lost: 12,
      winRate: 60,
      trend: 'up',
      trendValue: '+12%',
      color: 'bg-blue-500',
      icon: '🎯'
    },
    {
      name: "Meta Ads",
      leads: 34,
      won: 6,
      lost: 8,
      winRate: 43,
      trend: 'down',
      trendValue: '-8%',
      color: 'bg-purple-500',
      icon: '📘'
    },
    {
      name: "Microsoft Ads",
      leads: 18,
      won: 3,
      lost: 2,
      winRate: 60,
      trend: 'up',
      trendValue: '+5%',
      color: 'bg-green-500',
      icon: '🔍'
    },
    {
      name: "Direct Traffic",
      leads: 6,
      won: 1,
      lost: 1,
      winRate: 50,
      trend: 'up',
      trendValue: '+2%',
      color: 'bg-orange-500',
      icon: '🌐'
    }
  ];

  const totalLeads = sourceData.reduce((sum, source) => sum + source.leads, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle>Lead Sources Performance</CardTitle>
          <CardDescription>
            ROI and conversion rates by traffic source
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sourceData.map((source, index) => {
              const percentage = ((source.leads / totalLeads) * 100).toFixed(1);
              const isPositiveTrend = source.trend === 'up';

              return (
                <motion.div
                  key={source.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="p-4 rounded-lg border border-white/5 bg-white/2 hover:bg-white/5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{source.icon}</span>
                      <div>
                        <h4 className="font-medium">{source.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {source.leads} leads ({percentage}%)
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold">{source.winRate}%</span>
                        <span className={`text-xs flex items-center gap-1 ${isPositiveTrend ? 'text-green-400' : 'text-red-400'
                          }`}>
                          {isPositiveTrend ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {source.trendValue}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">win rate</p>
                    </div>
                  </div>

                  {/* Win/Loss Bar */}
                  <div className="flex gap-1 mb-2">
                    <div
                      className="h-2 bg-green-500 rounded-l"
                      style={{
                        width: `${(source.won / (source.won + source.lost)) * 100}%`,
                        minWidth: '4px'
                      }}
                    />
                    <div
                      className="h-2 bg-red-500 rounded-r"
                      style={{
                        width: `${(source.lost / (source.won + source.lost)) * 100}%`,
                        minWidth: '4px'
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        {source.won} won
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        {source.lost} lost
                      </span>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {source.leads - source.won - source.lost} pending
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* AI Optimization - Coming Soon */}
          <div className="mt-6 p-6 rounded-lg bg-gradient-to-br from-primary/10 via-purple-500/10 to-secondary/10 border border-primary/20 relative overflow-hidden">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-primary/20 to-purple-500/20">
                  <span className="text-lg">🤖</span>
                </div>
                <div>
                  <h4 className="font-bold text-transparent bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-lg">
                    AI Optimization Engine
                  </h4>
                  <Badge className="bg-gradient-to-r from-purple-500/20 to-primary/20 text-purple-300 border-purple-400/30 text-xs animate-pulse">
                    Coming Soon
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Our AI will analyze your conversion patterns in real-time and automatically suggest budget reallocations,
                audience optimizations, and bid adjustments. Get ready for <span className="text-primary font-medium">30-50% better ROI</span> with zero manual work.
              </p>

              {/* Preview of what's coming */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                  <div className="w-1 h-1 rounded-full bg-gradient-to-r from-primary to-purple-500" />
                  <span>Smart budget redistribution based on conversion quality</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                  <div className="w-1 h-1 rounded-full bg-gradient-to-r from-purple-500 to-secondary" />
                  <span>Automatic audience expansion for high-performing segments</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                  <div className="w-1 h-1 rounded-full bg-gradient-to-r from-secondary to-primary" />
                  <span>Predictive bid adjustments to maximize conversions</span>
                </div>
              </div>

            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LeadSourceChart;