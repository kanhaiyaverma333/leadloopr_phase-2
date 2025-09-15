import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useFunnelMetrics } from '@/lib/hooks/useLeadsData';

const FunnelChart = () => {
  const { funnelData, isLoading, error } = useFunnelMetrics();

  // Show loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Conversion Funnel</CardTitle>
            <CardDescription>Track where leads drop off in your sales process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading funnel data...
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Conversion Funnel</CardTitle>
            <CardDescription>Track where leads drop off in your sales process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-red-500 py-12">
              <p>Unable to load funnel data.</p>
              <p className="text-sm text-muted-foreground mt-1">Please check your connection and try again.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show empty state
  if (!funnelData || funnelData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Conversion Funnel</CardTitle>
            <CardDescription>Track where leads drop off in your sales process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-12">
              <p>No funnel data available yet.</p>
              <p className="text-sm mt-1">Start receiving leads to see your conversion funnel.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Conversion Funnel</CardTitle>
          <CardDescription>Track where leads drop off in your sales process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {funnelData.map((stage, index) => (
              <motion.div
                key={stage.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <span className="font-medium">{stage.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg">{stage.count}</span>
                    <span className="text-sm text-muted-foreground ml-2">({stage.percentage}%)</span>
                  </div>
                </div>

                {/* Stronger track with accent border */}
                <div className={`relative h-4 rounded-lg bg-muted/60 border ${stage.border} overflow-hidden`}>
                  {/* subtle light overlay for light theme pop */}
                  <div className={`absolute inset-0 opacity-60 dark:opacity-0 ${stage.light}`} />

                  {/* Filled bar */}
                  <div
                    className={`relative h-full ${stage.color} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]`}
                    style={{ width: `${stage.percentage}%` }}
                  >
                    {/* gradient sheen */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/0 to-white/0 mix-blend-overlay" />
                    {/* percentage label inside bar */}
                    {stage.percentage > 10 && (
                      <div className="absolute inset-y-0 right-2 flex items-center">
                        <span className="text-[10px] font-semibold text-white drop-shadow">{stage.percentage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dropout indicator */}
                {index < funnelData.length - 1 && funnelData[index + 1] && (
                  <div className="text-xs text-rose-500 mt-1">
                    -{stage.count - funnelData[index + 1].count} dropped off to next stage
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* AI Insights - Coming Soon */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-br from-primary/8 via-purple-500/8 to-secondary/8 border border-primary/15 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-primary/15 to-purple-500/15">
                  <span className="text-sm">ðŸ§ </span>
                </div>
                <h4 className="font-semibold text-transparent bg-gradient-to-r from-primary to-purple-400 bg-clip-text">AI-Powered Insights</h4>
                <Badge className="bg-gradient-to-r from-purple-500/15 to-primary/15 text-purple-300 border-purple-400/25 text-xs animate-pulse">Coming Soon</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                Soon, our AI will automatically identify conversion bottlenecks and suggest precise actions to improve your funnel performance.
              </p>
              <div className="space-y-2 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="text-xs text-primary/70 font-medium">AI analysis coming soon...</div>
                </div>
                {/* Show sample insights based on actual data when available */}
                {funnelData.length > 1 && (
                  <ul className="text-xs text-muted-foreground/60 space-y-1">
                    <li>â€¢ {Math.round(((funnelData[0].count - (funnelData[1]?.count || 0)) / funnelData[0].count) * 100)}% drop from leads to qualified - consider faster follow-up</li>
                    {funnelData.length > 2 && (
                      <li>â€¢ {Math.round((funnelData[funnelData.length-1].count / funnelData[0].count) * 100)}% overall conversion rate</li>
                    )}
                    <li>â€¢ Pipeline optimization recommendations will appear here</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FunnelChart;