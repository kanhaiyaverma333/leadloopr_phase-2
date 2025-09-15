// hooks/useLeadsData.ts
import { useQuery } from '@tanstack/react-query';
import React from 'react';

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

// Derived data hooks
export const useDashboardMetrics = () => {
  const { data: leadsData, ...rest } = useLeadsData();
  
  const metrics = React.useMemo(() => {
    if (!leadsData?.leads) return null;
    
    const leads = leadsData.leads;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // This week's leads
    const thisWeekLeads = leads.filter(lead => 
      new Date(lead.createdAt) >= oneWeekAgo
    );
    
    // Last week's leads for comparison
    const lastWeekLeads = leads.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= twoWeeksAgo && createdAt < oneWeekAgo;
    });
    
    // Qualified leads
    const qualifiedLeads = leads.filter(lead => lead.qualification === 'QUALIFIED');
    const thisWeekQualified = thisWeekLeads.filter(lead => lead.qualification === 'QUALIFIED');
    const lastWeekQualified = lastWeekLeads.filter(lead => lead.qualification === 'QUALIFIED');
    
    // Won deals (assuming stages with names containing 'won', 'closed', 'success')
    const wonDeals = leads.filter(lead => 
      lead.stage?.name.toLowerCase().includes('won') ||
      lead.stage?.name.toLowerCase().includes('closed') ||
      lead.stage?.name.toLowerCase().includes('success')
    );
    
    const thisWeekWon = wonDeals.filter(lead => 
      new Date(lead.createdAt) >= oneWeekAgo
    );
    const lastWeekWon = wonDeals.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= twoWeeksAgo && createdAt < oneWeekAgo;
    });
    
    // Lost deals (assuming stages with names containing 'lost', 'rejected')
    const lostDeals = leads.filter(lead => 
      lead.stage?.name.toLowerCase().includes('lost') ||
      lead.stage?.name.toLowerCase().includes('rejected') ||
      lead.stage?.name.toLowerCase().includes('failed')
    );
    
    const thisWeekLost = lostDeals.filter(lead => 
      new Date(lead.createdAt) >= oneWeekAgo
    );
    const lastWeekLost = lostDeals.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= twoWeeksAgo && createdAt < oneWeekAgo;
    });
    
    // Calculate changes
    const newLeadsChange = lastWeekLeads.length > 0 
      ? ((thisWeekLeads.length - lastWeekLeads.length) / lastWeekLeads.length * 100)
      : (thisWeekLeads.length > 0 ? 100 : 0);
    
    const qualificationRate = leads.length > 0 ? (qualifiedLeads.length / leads.length * 100) : 0;
    const lastWeekQualificationRate = lastWeekLeads.length > 0 ? (lastWeekQualified.length / lastWeekLeads.length * 100) : 0;
    const qualificationChange = lastWeekQualificationRate > 0 
      ? qualificationRate - lastWeekQualificationRate 
      : 0;
    
    const thisWeekRevenue = thisWeekWon.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const lastWeekRevenue = lastWeekWon.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const revenueChange = lastWeekRevenue > 0 
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100)
      : (thisWeekRevenue > 0 ? 100 : 0);
    
    const lostDealsChange = lastWeekLost.length > 0 
      ? ((thisWeekLost.length - lastWeekLost.length) / lastWeekLost.length * 100)
      : 0;
    
    return {
      newLeadsThisWeek: thisWeekLeads.length,
      newLeadsChange: `${newLeadsChange >= 0 ? '+' : ''}${newLeadsChange.toFixed(1)}%`,
      newLeadsChangePositive: newLeadsChange >= 0,
      
      qualificationRate: `${qualificationRate.toFixed(1)}%`,
      qualificationChange: `${qualificationChange >= 0 ? '+' : ''}${qualificationChange.toFixed(1)}%`,
      qualificationChangePositive: qualificationChange >= 0,
      
      thisWeekRevenue,
      revenueChange: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(0)}%`,
      revenueChangePositive: revenueChange >= 0,
      wonDealsCount: thisWeekWon.length,
      
      lostDealsThisWeek: thisWeekLost.length,
      lostDealsChange: `${lostDealsChange >= 0 ? '+' : ''}${lostDealsChange.toFixed(0)}%`,
      lostDealsChangePositive: lostDealsChange < 0, // negative change is positive for lost deals
    };
  }, [leadsData]);
  
  return { metrics, ...rest };
};

export const useLeadSourceMetrics = () => {
  const { data: leadsData, ...rest } = useLeadsData();
  
  const sourceMetrics = React.useMemo(() => {
    if (!leadsData?.leads) return [];
    
    const leads = leadsData.leads;
    
    // Group leads by source
    const sourceGroups = leads.reduce((acc, lead) => {
      let source = 'Direct Traffic';
      let icon = '🌐';
      
      // Determine source based on UTM or tracking parameters
      if (lead.gclid || lead.utmSource?.toLowerCase().includes('google')) {
        source = 'Google Ads';
        icon = '🎯';
      } else if (lead.fbclid || lead.utmSource?.toLowerCase().includes('facebook') || lead.utmSource?.toLowerCase().includes('meta')) {
        source = 'Meta Ads';
        icon = '📘';
      } else if (lead.msclkid || lead.utmSource?.toLowerCase().includes('microsoft') || lead.utmSource?.toLowerCase().includes('bing')) {
        source = 'Microsoft Ads';
        icon = '📊';
      } else if (lead.utmSource?.toLowerCase().includes('linkedin')) {
        source = 'LinkedIn Ads';
        icon = '💼';
      }
      
      if (!acc[source]) {
        acc[source] = {
          name: source,
          icon,
          leads: [],
          color: source === 'Google Ads' ? 'bg-blue-500' :
                 source === 'Meta Ads' ? 'bg-purple-500' :
                 source === 'Microsoft Ads' ? 'bg-green-500' :
                 source === 'LinkedIn Ads' ? 'bg-blue-600' : 'bg-orange-500'
        };
      }
      
      acc[source].leads.push(lead);
      return acc;
    }, {} as Record<string, any>);
    
    // Calculate metrics for each source
    return Object.values(sourceGroups).map((group: any) => {
      const wonLeads = group.leads.filter((lead: Lead) => 
        lead.stage?.name.toLowerCase().includes('won') ||
        lead.stage?.name.toLowerCase().includes('closed') ||
        lead.stage?.name.toLowerCase().includes('success')
      );
      
      const lostLeads = group.leads.filter((lead: Lead) => 
        lead.stage?.name.toLowerCase().includes('lost') ||
        lead.stage?.name.toLowerCase().includes('rejected') ||
        lead.stage?.name.toLowerCase().includes('failed')
      );
      
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
  }, [leadsData]);
  
  return { sourceMetrics, ...rest };
};

export const useFunnelMetrics = () => {
  const { data: leadsData, ...rest } = useLeadsData();
  
  const funnelData = React.useMemo(() => {
    if (!leadsData?.leads) return [];
    
    const leads = leadsData.leads;
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
    stages.forEach((stage: any, index) => {
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
  }, [leadsData]);
  
  return { funnelData, ...rest };
};

export const useActivityStream = () => {
  const { data: leadsData, ...rest } = useLeadsData();
  
  const activities = React.useMemo(() => {
    if (!leadsData?.leads) return [];
    
    const leads = leadsData.leads;
    const activities: any[] = [];
    
    // Convert recent leads to activity items
    const recentLeads = [...leads]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
    
    recentLeads.forEach((lead, index) => {
      const createdAt = new Date(lead.createdAt);
      const updatedAt = new Date(lead.updatedAt);
      const now = new Date();
      
      // Determine source
      let source = 'Direct Traffic';
      if (lead.gclid || lead.utmSource?.toLowerCase().includes('google')) {
        source = 'Google Ads';
      } else if (lead.fbclid || lead.utmSource?.toLowerCase().includes('facebook')) {
        source = 'Meta Ads';
      } else if (lead.msclkid || lead.utmSource?.toLowerCase().includes('microsoft')) {
        source = 'Microsoft Ads';
      }
      
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
      let description = `Lead #${lead.id.slice(-4)} from ${source}`;
      let status = 'info';
      
      if (lead.qualification === 'QUALIFIED') {
        type = 'lead_qualified';
        title = 'Lead qualified';
        description = `Lead #${lead.id.slice(-4)} marked as qualified`;
        status = 'success';
      } else if (lead.stage?.name.toLowerCase().includes('won')) {
        type = 'deal_won';
        title = 'Deal closed';
        description = `Lead #${lead.id.slice(-4)} converted to ${lead.value ? `$${lead.value.toLocaleString()}` : ''} deal`;
        status = 'success';
      } else if (lead.stage?.name.toLowerCase().includes('lost')) {
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
        source,
        value: lead.value ? `$${lead.value.toLocaleString()}` : undefined,
        status
      });
    });
    
    return activities;
  }, [leadsData]);
  
  return { activities, ...rest };
};