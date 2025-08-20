'use client';

import React, { createContext, useContext } from 'react';

// Mock Studio type (ajusta según tu modelo real)
export interface Studio {
  id: string;
  name: string;
  location?: string;
  phone?: string;
  description?: string;
}

interface StudioContextType {
  studio: Studio | null;
  loading: boolean;
  refreshStudio: () => Promise<void>;
  setSelectedStudio?: (studio: Studio) => void;
}

const StudioContext = createContext<StudioContextType>({
  studio: null,
  loading: false,
  refreshStudio: async () => {},
  setSelectedStudio: () => {},
});

export function useStudio() {
  return useContext(StudioContext);
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  // Implementa lógica real aquí si es necesario
  return (
    <StudioContext.Provider value={{ studio: null, loading: false, refreshStudio: async () => {}, setSelectedStudio: () => {} }}>
      {children}
    </StudioContext.Provider>
  );
}
