
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Studio } from '@/lib/firebase/firestore';

interface StudioContextType {
  studio: Studio | null;
  loading: boolean;
  setStudio: (studio: Studio | null) => void;
  refreshStudio: () => Promise<void>;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export const StudioProvider = ({ children }: { children: ReactNode }) => {
  const [studio, setStudioState] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const storedStudio = localStorage.getItem('selectedStudio');
      if (storedStudio) {
        setStudioState(JSON.parse(storedStudio));
      }
    } catch (error) {
      console.error("Failed to load studio from localStorage", error);
      localStorage.removeItem('selectedStudio'); // Clear corrupted data
    } finally {
      setLoading(false);
    }
  }, []);

  const setStudio = (studio: Studio | null) => {
    setStudioState(studio);
    if (studio) {
      localStorage.setItem('selectedStudio', JSON.stringify(studio));
    } else {
      localStorage.removeItem('selectedStudio');
    }
  };

  const refreshStudio = useCallback(async () => {
    // This function can be expanded later if we need to re-fetch studio details
    // For now, it does nothing as the studio data is loaded from selection.
    return Promise.resolve();
  }, []);

  return (
    <StudioContext.Provider value={{ studio, loading, setStudio, refreshStudio }}>
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
};
