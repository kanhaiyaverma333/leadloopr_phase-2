import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Target,
  DollarSign,
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useActivityStream } from '@/lib/hooks/useLeadsData';

const ActivityStream = () => {
  const { activities, isLoading, error } = useActivityStream();

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead_received':
        return UserPlus;
      case 'lead_qualified':
        return Target;
      case 'deal_won':
        return DollarSign;
      case 'deal_lost':
        return X;
      case 'sync_success':
        return CheckCircle;
      case 'sync_failed':
        return AlertTriangle;
      default:
        return RefreshCw;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400 bg-green-400/10';
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'error':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-blue-400 bg-blue-400/10';
    }
  };

  const getSourceBadge = (source?: string) => {
    if (!source) return null;

    const sourceConfig = {
      'Google Ads': { color: 'bg-blue-500/10 text-blue-400', icon: '🎯' },
      'Meta Ads': { color: 'bg-purple-500/10 text-purple-400', icon: '📘' },
      'Microsoft Ads': { color: 'bg-green-500/10 text-green-400', icon: '📊' },
      'LinkedIn Ads': { color: 'bg-blue-600/10 text-blue-400', icon: '💼' },
    };

    const config = sourceConfig[source as keyof typeof sourceConfig] || {
      color: 'bg-gray-500/10 text-gray-400',
      icon: '🌐'
    };

    return (
      <Badge variant="outline" className={`text-xs ${config.color} border-current/20`}>
        {config.icon} {source}
      </Badge>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Live Activity Stream
            </CardTitle>
            <CardDescription>
              Real-time updates on leads and sync status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading activity stream...
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
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Live Activity Stream
            </CardTitle>
            <CardDescription>
              Real-time updates on leads and sync status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-red-500 py-12">
              <p>Unable to load activity stream.</p>
              <p className="text-sm text-muted-foreground mt-1">Please check your connection and try again.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show empty state
  if (!activities || activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Live Activity Stream
            </CardTitle>
            <CardDescription>
              Real-time updates on leads and sync status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-12">
              <p>No activity yet.</p>
              <p className="text-sm mt-1">Lead activities will appear here as they happen.</p>
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
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Live Activity Stream
          </CardTitle>
          <CardDescription>
            Real-time updates on leads and sync status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = getIcon(activity.type);
              const statusColor = getStatusColor(activity.status);

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex gap-3 p-3 rounded-lg border border-white/5 bg-white/2 hover:bg-white/5 transition-all duration-300"
                >
                  <div className={`p-2 rounded-lg ${statusColor} flex-shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{activity.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {activity.description}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap">
                          {activity.source && getSourceBadge(activity.source)}
                          {activity.value && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-400/20">
                              {activity.value}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Activity Insights */}
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-br from-primary/8 via-purple-500/8 to-secondary/8 border border-primary/15 relative overflow-hidden">
            {/* Subtle animated glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-primary/15 to-purple-500/15">
                  <span className="text-sm">📊</span>
                </div>
                <h4 className="font-semibold text-transparent bg-gradient-to-r from-primary to-purple-400 bg-clip-text">
                  Activity Insights
                </h4>
                <Badge className="bg-gradient-to-r from-purple-500/15 to-primary/15 text-purple-300 border-purple-400/25 text-xs animate-pulse">
                  Coming Soon
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                Soon, our AI will automatically analyze your activity patterns and provide actionable insights to optimize your lead management process.
              </p>

              {/* Preview insights with blur effect to show it's coming */}
              <div className="space-y-2 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="text-xs text-primary/70 font-medium">AI analysis coming soon...</div>
                </div>
                {/* Show sample insights based on actual data when available */}
                {activities.length > 0 && (
                  <ul className="text-xs text-muted-foreground/60 space-y-1">
                    <li>• Peak activity detected in recent hours</li>
                    <li>• {activities.filter(a => a.type === 'lead_received').length} new leads in current session</li>
                    <li>• Average response time analysis will appear here</li>
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

export default ActivityStream;