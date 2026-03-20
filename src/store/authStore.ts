import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AdminUserUpdate {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
}

interface AuthState {
  users: User[];
  currentUser: User | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<{ user?: User; error?: string }>;
  updateProfile: (updates: { name?: string; email?: string; password?: string; phone?: string }) => Promise<{ error?: string }>;
  isAdmin: () => boolean;
  getUserById: (id: number) => User | undefined;
  fetchUsers: () => Promise<void>;
  initialize: () => Promise<void>;
  adminCreateUser: (data: { name: string; email: string; password: string; role: UserRole; phone?: string }) => Promise<{ user?: User; error?: string }>;
  adminUpdateUser: (id: number, updates: AdminUserUpdate) => Promise<{ error?: string }>;
  adminDeleteUser: (id: number) => Promise<{ error?: string }>;
  adminToggleSuspend: (id: number) => Promise<{ error?: string }>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  users: [],
  currentUser: null,
  initialized: false,

  initialize: async () => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      try {
        const data = await api.get<{ user: User }>('/auth/me');
        set({ currentUser: data.user, initialized: true });
        get().fetchUsers();
      } catch {
        localStorage.removeItem('auth-token');
        set({ initialized: true });
      }
    } else {
      set({ initialized: true });
    }
  },

  login: async (email, password) => {
    try {
      const data = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      localStorage.setItem('auth-token', data.token);
      set({ currentUser: data.user });
      get().fetchUsers();
      return data.user;
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('auth-token');
    set({ currentUser: null });
  },

  register: async (name, email, password) => {
    try {
      const data = await api.post<{ token: string; user: User }>('/auth/register', { name, email, password });
      localStorage.setItem('auth-token', data.token);
      set({ currentUser: data.user });
      return { user: data.user };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  },

  updateProfile: async (updates) => {
    try {
      const data = await api.put<{ user: User }>('/auth/profile', updates);
      set({ currentUser: data.user });
      return {};
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  },

  isAdmin: () => get().currentUser?.role === 'admin',
  getUserById: (id) => get().users.find((u) => u.id === id),

  fetchUsers: async () => {
    try {
      const data = await api.get<{ users: User[] }>('/users');
      set({ users: data.users });
    } catch {
      // Not logged in or no permission
    }
  },

  adminCreateUser: async (data) => {
    try {
      const res = await api.post<{ user: User }>('/users', data);
      set((state) => ({ users: [...state.users, res.user] }));
      return { user: res.user };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  },

  adminUpdateUser: async (id, updates) => {
    try {
      const res = await api.put<{ user: User }>(`/users/${id}`, updates);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? res.user : u)),
        currentUser: state.currentUser?.id === id ? res.user : state.currentUser,
      }));
      return {};
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  },

  adminDeleteUser: async (id) => {
    try {
      await api.delete(`/users/${id}`);
      set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
      return {};
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  },

  adminToggleSuspend: async (id) => {
    try {
      const res = await api.post<{ user: User }>(`/users/${id}/suspend`);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? res.user : u)),
      }));
      return {};
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  },
}));
