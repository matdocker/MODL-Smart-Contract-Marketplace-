import { createContext, useContext, useState, ReactNode } from 'react';

type GaslessContextType = {
  gaslessEnabled: boolean;
  setGaslessEnabled: (enabled: boolean) => void;
};

const GaslessContext = createContext<GaslessContextType | undefined>(undefined);

export function GaslessProvider({ children }: { children: ReactNode }) {
  const [gaslessEnabled, setGaslessEnabled] = useState(false);

  return (
    <GaslessContext.Provider value={{ gaslessEnabled, setGaslessEnabled }}>
      {children}
    </GaslessContext.Provider>
  );
}

export function useGasless() {
  const context = useContext(GaslessContext);
  if (!context) {
    throw new Error('useGasless must be used within a GaslessProvider');
  }
  return context;
}
