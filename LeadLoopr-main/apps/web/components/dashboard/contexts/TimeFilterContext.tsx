// contexts/TimeFilterContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TimeFrame = 'week' | 'month' | 'quarter';

interface TimeFilterContextType {
  timeframe: TimeFrame;
  setTimeframe: (timeframe: TimeFrame) => void;
  getDateRange: () => { startDate: Date; endDate: Date };
  getComparisonDateRange: () => { startDate: Date; endDate: Date };
}

const TimeFilterContext = createContext<TimeFilterContextType | undefined>(undefined);

export const useTimeFilter = () => {
  const context = useContext(TimeFilterContext);
  if (!context) {
    throw new Error('useTimeFilter must be used within a TimeFilterProvider');
  }
  return context;
};

interface TimeFilterProviderProps {
  children: ReactNode;
}

export const TimeFilterProvider = ({ children }: TimeFilterProviderProps) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>('week');

  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        // Get start of current week (Monday)
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(now.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);
        break;
        
      case 'month':
        // Get start of current month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
        
      case 'quarter':
        // Get start of last 90 days
        startDate.setDate(now.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        break;
    }
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  };

  const getComparisonDateRange = () => {
    const { startDate, endDate } = getDateRange();
    const diffMs = endDate.getTime() - startDate.getTime();
    
    const comparisonEndDate = new Date(startDate.getTime() - 1);
    const comparisonStartDate = new Date(comparisonEndDate.getTime() - diffMs);
    
    return { 
      startDate: comparisonStartDate, 
      endDate: comparisonEndDate 
    };
  };

  return (
    <TimeFilterContext.Provider 
      value={{ 
        timeframe, 
        setTimeframe, 
        getDateRange, 
        getComparisonDateRange 
      }}
    >
      {children}
    </TimeFilterContext.Provider>
  );
};