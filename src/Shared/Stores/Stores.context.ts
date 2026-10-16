import { createContext, useContext } from 'react';
import type { AppStores } from './createAppStores';

export const StoresContext = createContext<AppStores | null>(null);

export function useStores(): AppStores {
  const stores = useContext(StoresContext);
  if (!stores) {
    throw new Error('useStores must be used inside <StoresContext>');
  }
  return stores;
}
