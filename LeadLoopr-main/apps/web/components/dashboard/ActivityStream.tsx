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
  RefreshCw
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'lead_received' | 'lead_qualified' | 'deal_won' | 'deal_lost' | 'sync_success' | 'sync_failed';
  title: string;
  description: string;
  timestamp: string;
  source?: string;
  value?: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

const ActivityStream = () => {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'lead_received',
      title: 'New lead received',
      description: 'Lead #1048 from Google Ads campaign "SaaS Keywords"',
      timestamp: '2 minutes ago',
      source: 'Google Ads',
      status: 'info'
    },
    {
      id: '2',
      type: 'sync_success',
      title: 'Deal won synced',
      description: 'Lead #1045 marked as won → synced to Google/Meta/Microsoft ✅',
      timestamp: '8 minutes ago',
      value: '$2,400',
      status: 'success'
    },
    {
      id: '3',
      type: 'lead_qualified',
      title: 'Lead qualified',
      description: 'Lead #1047 marked as qualified after discovery call',
      timestamp: '15 minutes ago',
      source: 'Meta Ads',
      status: 'success'
    },
    {
      id: '4',
      type: 'deal_lost',
      title: 'Deal marked as lost',
      description: 'Lead #1043 lost to competitor → synced to platforms ❌',
      timestamp: '32 minutes ago',
      status: 'warning'
    },
    {
      id: '5',
      type: 'sync_failed',
      title: 'Sync failed',
      description: 'Failed to sync lead #1042 to Meta - retrying in 5 minutes',
      timestamp: '45 minutes ago',
      status: 'error'
    },
    {
      id: '6',
      type: 'deal_won',
      title: 'Deal closed',
      description: 'Lead #1041 from Microsoft Ads converted to $3,200 deal',
      timestamp: '1 hour ago',
      value: '$3,200',
      source: 'Microsoft Ads',
      status: 'success'
    },
    {
      id: '7',
      type: 'lead_received',
      title: 'New lead received',
      description: 'Lead #1040 from organic search "CRM software comparison"',
      timestamp: '1 hour ago',
      source: 'Direct Traffic',
      status: 'info'
    },
    {
      id: '8',
      type: 'lead_qualified',
      title: 'Lead qualified',
      description: 'Lead #1039 qualified after demo presentation',
      timestamp: '2 hours ago',
      source: 'Google Ads',
      status: 'success'
    },
    {
      id: '9',
      type: 'sync_success',
      title: 'Campaign sync completed',
      description: 'All active campaigns synced to advertising platforms',
      timestamp: '3 hours ago',
      status: 'success'
    },
    {
      id: '10',
      type: 'lead_received',
      title: 'New lead received',
      description: 'Lead #1038 from LinkedIn campaign "B2B Solutions"',
      timestamp: '4 hours ago',
      source: 'LinkedIn Ads',
      status: 'info'
    }
  ];

  const getIcon = (type: ActivityItem['type']) => {
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

  const getStatusColor = (status: ActivityItem['status']) => {
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
      'Microsoft Ads': { color: 'bg-green-500/10 text-green-400', icon: '🔍' },
      'LinkedIn Ads': { color: 'bg-blue-600/10 text-blue-400', icon: '👔' },
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
                <ul className="text-xs text-muted-foreground/60 space-y-1">
                  <li>• Peak activity time: 2-4 PM - consider scheduling follow-ups</li>
                  <li>• Google Ads generates 45% of qualified leads</li>
                  <li>• Average response time: 15 minutes (industry leading)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ActivityStream;