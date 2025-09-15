// hooks/useLeadsData.ts
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTimeFilter } from '@/components/dashboard/contexts/TimeFilterContext';

export interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  websiteUrl: string | null;
  landingPageUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  currentStageId: string | null;
  value: number | null;
  currency: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  qualification: 'QUALIFIED' | 'UNQUALIFIED' | 'NEEDS_REVIEW';
  createdAt: string;
  updatedAt: string;
  stage: {
    id: string;
    name: string;
    position: number;
    color: string;
  } | null;
}

export interface LeadsResponse {
  success: boolean;
  leads: Lead[];
}

// Helper function to determine lead source
const getLeadSource = (lead: Lead) => {
  if (lead.gclid || lead.utmSource?.toLowerCase().includes('google')) {
    return { name: 'Google Ads', icon: '🎯', color: 'bg-blue-500' };
  }
  if (lead.fbclid || lead.utmSource?.toLowerCase().includes('facebook') || lead.utmSource?.toLowerCase().includes('meta')) {
    return { name: 'Meta Ads', icon: '📘', color: 'bg-purple-500' };
  }
  if (lead.msclkid || lead.utmSource?.toLowerCase().includes('microsoft') || lead.utmSource?.toLowerCase().includes('bing')) {
    return { name: 'Microsoft Ads', icon: '📊', color: 'bg-green-500' };
  }
  if (lead.utmSource?.toLowerCase().includes('linkedin')) {
    return { name: 'LinkedIn Ads', icon: '💼', color: 'bg-blue-600' };
  }
  return { name: 'Direct Traffic', icon: '🌍', color: 'bg-orange-500' };
};

// Helper function to check if lead is won
const isWonLead = (lead: Lead) => {
  return lead.stage?.name.toLowerCase().includes('won') ||
         lead.stage?.name.toLowerCase().includes('closed') ||
         lead.stage?.name.toLowerCase().includes('success');
};

// Helper function to check if lead is lost
const isLostLead = (lead: Lead) => {
  return lead.stage?.name.toLowerCase().includes('lost') ||
         lead.stage?.name.toLowerCase().includes('rejected') ||
         lead.stage?.name.toLowerCase().includes('failed');
};

// Fetch leads from API
const fetchLeads = async (): Promise<LeadsResponse> => {
  const response = await fetch('/api/leads');
  if (!response.ok) {
    throw new Error('Failed to fetch leads');
  }
  return response.json();
};

// Main hook for fetching leads
export const useLeadsData = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
};

// Hook for filtered leads based on time
export const useFilteredLeads = () => {
  const { data: leadsData, ...rest } = useLeadsData();
  const { getDateRange, timeframe } = useTimeFilter();

  const filteredData = React.useMemo(() => {
    if (!leadsData?.leads) return null;

    const { startDate, endDate } = getDateRange();
    
    const filteredLeads = leadsData.leads.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });

    return {
      ...leadsData,
      leads: filteredLeads
    };
  }, [leadsData, getDateRange, timeframe]);

  return { data: filteredData, ...rest };
};

// Updated dashboard metrics with time filtering
export const useDashboardMetrics = () => {
  const { data: leadsData, ...rest } = useLeadsData();
  const { getDateRange, getComparisonDateRange, timeframe } = useTimeFilter();
  
  const metrics = React.useMemo(() => {
    if (!leadsData?.leads) return null;
    
    const allLeads = leadsData.leads;
    const { startDate, endDate } = getDateRange();
    const { startDate: compStartDate, endDate: compEndDate } = getComparisonDateRange();
    
    // Current period leads
    const currentPeriodLeads = allLeads.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
    
    // Comparison period leads
    const comparisonPeriodLeads = allLeads.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= compStartDate && createdAt <= compEndDate;
    });
    
    // Qualified leads
    const currentQualified = currentPeriodLeads.filter(lead => lead.qualification === 'QUALIFIED');
    const comparisonQualified = comparisonPeriodLeads.filter(lead => lead.qualification === 'QUALIFIED');
    
    // Won deals
    const currentWon = currentPeriodLeads.filter(isWonLead);
    const comparisonWon = comparisonPeriodLeads.filter(isWonLead);
    
    // Lost deals
    const currentLost = currentPeriodLeads.filter(isLostLead);
    const comparisonLost = comparisonPeriodLeads.filter(isLostLead);
    
    // Calculate changes
    const newLeadsChange = comparisonPeriodLeads.length > 0 
      ? ((currentPeriodLeads.length - comparisonPeriodLeads.length) / comparisonPeriodLeads.length * 100)
      : (currentPeriodLeads.length > 0 ? 100 : 0);
    
    const qualificationRate = currentPeriodLeads.length > 0 ? (currentQualified.length / currentPeriodLeads.length * 100) : 0;
    const compQualificationRate = comparisonPeriodLeads.length > 0 ? (comparisonQualified.length / comparisonPeriodLeads.length * 100) : 0;
    const qualificationChange = qualificationRate - compQualificationRate;
    
    const currentRevenue = currentWon.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const comparisonRevenue = comparisonWon.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const revenueChange = comparisonRevenue > 0 
      ? ((currentRevenue - comparisonRevenue) / comparisonRevenue * 100)
      : (currentRevenue > 0 ? 100 : 0);
    
    const lostDealsChange = comparisonLost.length > 0 
      ? ((currentLost.length - comparisonLost.length) / comparisonLost.length * 100)
      : 0;

    // Get period label
    const getPeriodLabel = () => {
      switch (timeframe) {
        case 'week': return 'This Week';
        case 'month': return 'This Month';
        case 'quarter': return 'Last 90 Days';
        default: return 'Current Period';
      }
    };
    
    return {
      periodLabel: getPeriodLabel(),
      newLeadsCount: currentPeriodLeads.length,
      newLeadsChange: `${newLeadsChange >= 0 ? '+' : ''}${newLeadsChange.toFixed(1)}%`,
      newLeadsChangePositive: newLeadsChange >= 0,
      
      qualificationRate: `${qualificationRate.toFixed(1)}%`,
      qualificationChange: `${qualificationChange >= 0 ? '+' : ''}${qualificationChange.toFixed(1)}%`,
      qualificationChangePositive: qualificationChange >= 0,
      
      currentRevenue,
      revenueChange: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(0)}%`,
      revenueChangePositive: revenueChange >= 0,
      wonDealsCount: currentWon.length,
      
      lostDealsCount: currentLost.length,
      lostDealsChange: `${lostDealsChange >= 0 ? '+' : ''}${lostDealsChange.toFixed(0)}%`,
      lostDealsChangePositive: lostDealsChange < 0, // negative change is positive for lost deals
    };
  }, [leadsData, getDateRange, getComparisonDateRange, timeframe]);
  
  return { metrics, ...rest };
};

// Updated lead source metrics with time filtering
export const useLeadSourceMetrics = () => {
  const { data: filteredData, ...rest } = useFilteredLeads();
  
  const sourceMetrics = React.useMemo(() => {
    if (!filteredData?.leads) return [];
    
    const leads = filteredData.leads;
    
    // Group leads by source
    const sourceGroups = leads.reduce((acc, lead) => {
      const source = getLeadSource(lead);
      
      if (!acc[source.name]) {
        acc[source.name] = {
          ...source,
          leads: [],
        };
      }
      
      acc[source.name].leads.push(lead);
      return acc;
    }, {} as Record<string, any>);
    
    // Calculate metrics for each source
    return Object.values(sourceGroups).map((group: any) => {
      const wonLeads = group.leads.filter(isWonLead);
      const lostLeads = group.leads.filter(isLostLead);
      
      const winRate = (wonLeads.length + lostLeads.length) > 0 
        ? Math.round((wonLeads.length / (wonLeads.length + lostLeads.length)) * 100)
        : 0;
      
      // Mock trend for now (you could calculate this based on time periods)
      const trend = Math.random() > 0.5 ? 'up' : 'down';
      const trendValue = `${trend === 'up' ? '+' : '-'}${Math.floor(Math.random() * 20)}%`;
      
      return {
        name: group.name,
        leads: group.leads.length,
        won: wonLeads.length,
        lost: lostLeads.length,
        winRate,
        trend,
        trendValue,
        color: group.color,
        icon: group.icon,
      };
    }).sort((a, b) => b.leads - a.leads);
  }, [filteredData]);
  
  return { sourceMetrics, ...rest };
};

// Updated funnel metrics with time filtering
export const useFunnelMetrics = () => {
  const { data: filteredData, ...rest } = useFilteredLeads();
  
  const funnelData = React.useMemo(() => {
    if (!filteredData?.leads) return [];
    
    const leads = filteredData.leads;
    const totalLeads = leads.length;
    
    if (totalLeads === 0) return [];
    
    // Calculate funnel stages
    const qualifiedLeads = leads.filter(lead => lead.qualification === 'QUALIFIED');
    
    // Assuming stages are ordered by position
    const stageGroups = leads.reduce((acc, lead) => {
      if (lead.stage) {
        if (!acc[lead.stage.name]) {
          acc[lead.stage.name] = {
            name: lead.stage.name,
            position: lead.stage.position,
            count: 0
          };
        }
        acc[lead.stage.name].count++;
      }
      return acc;
    }, {} as Record<string, any>);
    
    const stages = Object.values(stageGroups).sort((a: any, b: any) => a.position - b.position);
    
    // Create funnel data
    const funnelStages = [
      {
        name: 'Leads Received',
        count: totalLeads,
        percentage: 100,
        color: 'bg-blue-500',
        light: 'bg-blue-100',
        border: 'border-blue-200'
      },
      {
        name: 'Qualified Leads',
        count: qualifiedLeads.length,
        percentage: Math.round((qualifiedLeads.length / totalLeads) * 100),
        color: 'bg-green-500',
        light: 'bg-green-100',
        border: 'border-green-200'
      }
    ];
    
    // Add custom stages from database
    stages.forEach((stage: any) => {
      const percentage = Math.round((stage.count / totalLeads) * 100);
      
      // Determine color based on stage name
      let color = 'bg-gray-500';
      let light = 'bg-gray-100';
      let border = 'border-gray-200';
      
      if (stage.name.toLowerCase().includes('proposal') || stage.name.toLowerCase().includes('quote')) {
        color = 'bg-amber-500';
        light = 'bg-amber-100';
        border = 'border-amber-200';
      } else if (stage.name.toLowerCase().includes('won') || stage.name.toLowerCase().includes('closed')) {
        color = 'bg-emerald-500';
        light = 'bg-emerald-100';
        border = 'border-emerald-200';
      } else if (stage.name.toLowerCase().includes('lost') || stage.name.toLowerCase().includes('rejected')) {
        color = 'bg-rose-500';
        light = 'bg-rose-100';
        border = 'border-rose-200';
      }
      
      funnelStages.push({
        name: stage.name,
        count: stage.count,
        percentage,
        color,
        light,
        border
      });
    });
    
    return funnelStages;
  }, [filteredData]);
  
  return { funnelData, ...rest };
};

// Updated activity stream with time filtering
export const useActivityStream = () => {
  const { data: filteredData, ...rest } = useFilteredLeads();
  
  const activities = React.useMemo(() => {
    if (!filteredData?.leads) return [];
    
    const leads = filteredData.leads;
    const activities: any[] = [];
    
    // Convert recent leads to activity items
    const recentLeads = [...leads]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
    
    recentLeads.forEach((lead, index) => {
      const updatedAt = new Date(lead.updatedAt);
      const now = new Date();
      
      // Determine source
      const source = getLeadSource(lead);
      
      // Calculate time ago
      const diffMs = now.getTime() - updatedAt.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      let timeAgo = '';
      if (diffMins < 60) {
        timeAgo = `${diffMins} minutes ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }
      
      // Determine activity type based on stage and timing
      let type = 'lead_received';
      let title = 'New lead received';
      let description = `Lead #${lead.id.slice(-4)} from ${source.name}`;
      let status = 'info';
      
      if (lead.qualification === 'QUALIFIED') {
        type = 'lead_qualified';
        title = 'Lead qualified';
        description = `Lead #${lead.id.slice(-4)} marked as qualified`;
        status = 'success';
      } else if (isWonLead(lead)) {
        type = 'deal_won';
        title = 'Deal closed';
        description = `Lead #${lead.id.slice(-4)} converted to ${lead.value ? `$${lead.value.toLocaleString()}` : ''} deal`;
        status = 'success';
      } else if (isLostLead(lead)) {
        type = 'deal_lost';
        title = 'Deal marked as lost';
        description = `Lead #${lead.id.slice(-4)} lost to competitor`;
        status = 'warning';
      }
      
      activities.push({
        id: `${lead.id}-${index}`,
        type,
        title,
        description,
        timestamp: timeAgo,
        source: source.name,
        value: lead.value ? `$${lead.value.toLocaleString()}` : undefined,
        status
      });
    });
    
    return activities;
  }, [filteredData]);
  
  return { activities, ...rest };
};