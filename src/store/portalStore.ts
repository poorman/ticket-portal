import { create } from 'zustand';

export type PortalId = 'crane' | 'car';

interface PortalConfig {
  id: PortalId;
  name: string;
  logo: string;
  supportText: string;
}

export const PORTALS: Record<PortalId, PortalConfig> = {
  crane: {
    id: 'crane',
    name: 'Crane Network',
    logo: '/cranenetwork.png',
    supportText: 'support',
  },
  car: {
    id: 'car',
    name: 'Car Network',
    logo: '/carnetwork.png',
    supportText: 'support',
  },
};

interface PortalState {
  activePortal: PortalId;
  setPortal: (portal: PortalId) => void;
}

export const usePortalStore = create<PortalState>()((set) => ({
  activePortal: (localStorage.getItem('active-portal') as PortalId) || 'crane',
  setPortal: (portal) => {
    localStorage.setItem('active-portal', portal);
    set({ activePortal: portal });
  },
}));
