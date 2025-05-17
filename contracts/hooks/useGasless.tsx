import { createContext, useContext, useState, ReactNode } from 'react';

// Define the context type
type GaslessContextType = {
  gaslessEnabled: boolean;
  setGaslessEnabled: (enabled: boolean) => void;
  tier: number;
};

// Create context instance
const GaslessContext = createContext<GaslessContextType>({
  gaslessEnabled: false,
  setGaslessEnabled: () => {
    throw new Error('setGaslessEnabled must be used within a GaslessProvider');
  },
  tier: 1,
});

// Hook for components to use context
export function useGasless() {
  return useContext(GaslessContext);
}

// Props type for provider
type GaslessProviderProps = {
  children: ReactNode;
  initialTier?: number;
};

// Provider component
export function GaslessProvider({ children, initialTier = 1 }: GaslessProviderProps) {
  const [gaslessEnabled, setGaslessEnabled] = useState(false);
  const tier = initialTier;

  return (
    <GaslessContext.Provider value={{ gaslessEnabled, setGaslessEnabled, tier }}>
      {children}
    </GaslessContext.Provider>
  );
}
