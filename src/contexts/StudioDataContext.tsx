'use client';

import React, { createContext, useContext } from 'react';

// Mock StudioConfig type (ajusta según tu modelo real)
export interface StudioConfig {
  workingHours: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>;
}

interface StudioDataContextType {
  studioId: string | undefined;
  config: StudioConfig | null;
  refreshData: () => Promise<void>;
  loading: boolean;
}

const StudioDataContext = createContext<StudioDataContextType>({
  studioId: undefined,
  config: null,
  refreshData: async () => {},
  loading: false,
});

export function useStudioData() {
  return useContext(StudioDataContext);
}

export function StudioDataProvider({ children }: { children: React.ReactNode }) {
  // Implementa lógica real aquí si es necesario
  return (
    <StudioDataContext.Provider value={{ studioId: undefined, config: null, refreshData: async () => {}, loading: false }}>
      {children}
    </StudioDataContext.Provider>
  );
}
