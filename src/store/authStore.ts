import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';
import { hashPassword, verifyPassword } from '../lib/auth-utils';

interface AuthState {
  users: User[];
  currentUser: User | null;
  nextUserId: number;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  register: (name: string, email: string, password: string) => { user?: User; error?: string };
  isAdmin: () => boolean;
  getUserById: (id: number) => User | undefined;
}

const DEFAULT_ADMIN: User = {
  id: 1,
  email: 'admin@widesurf.com',
  password: hashPassword('admin123'),
  name: 'Admin User',
  role: 'admin' as UserRole,
  createdAt: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [DEFAULT_ADMIN],
      currentUser: null,
      nextUserId: 2,

      login: (email: string, password: string) => {
        const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return null;
        if (!verifyPassword(password, user.password)) return null;
        set({ currentUser: user });
        return user;
      },

      logout: () => {
        set({ currentUser: null });
      },

      register: (name: string, email: string, password: string) => {
        const existing = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) return { error: 'A user with this email already exists' };

        const newUser: User = {
          id: get().nextUserId,
          email,
          password: hashPassword(password),
          name,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          users: [...state.users, newUser],
          nextUserId: state.nextUserId + 1,
        }));
        return { user: newUser };
      },

      isAdmin: () => get().currentUser?.role === 'admin',

      getUserById: (id: number) => get().users.find((u) => u.id === id),
    }),
    {
      name: 'ticket-portal-auth',
    }
  )
);
