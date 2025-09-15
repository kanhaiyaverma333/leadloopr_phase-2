"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type DurationType = 'week' | 'month' | 'quarter';

interface DurationFilterContextType {
  duration: DurationType;
  setDuration: (duration: DurationType) => void;
  getDateRange: () => { startDate: string; endDate: string };
}

const DurationFilterContext = createContext<DurationFilterContextType | undefined>(undefined);

export const useDurationFilter = () => {
  const context = useContext(DurationFilterContext);
  if (!context) {
    throw new Error('useDurationFilter must be used within a DurationFilterProvider');
  }
  return context;
};

interface DurationFilterProviderProps {
  children: ReactNode;
}

export const DurationFilterProvider: React.FC<DurationFilterProviderProps> = ({ children }) => {
  const [duration, setDuration] = useState<DurationType>('week');

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (duration) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  };

  return (
    <DurationFilterContext.Provider value={{ duration, setDuration, getDateRange }}>
      {children}
    </DurationFilterContext.Provider>
  );
};
