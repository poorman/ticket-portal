import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';
import { hashPassword, verifyPassword } from '../lib/auth-utils';

interface AdminUserUpdate {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
}

function generateUsername(email: string, existingUsers: User[]): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  let candidate = base;
  let counter = 1;
  while (existingUsers.some((u) => u.username === candidate)) {
    candidate = `${base}${counter}`;
    counter++;
  }
  return candidate;
}

interface AuthState {
  users: User[];
  currentUser: User | null;
  nextUserId: number;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  register: (name: string, email: string, password: string) => { user?: User; error?: string };
  updateProfile: (updates: { name?: string; email?: string; password?: string; phone?: string }) => { error?: string };
  isAdmin: () => boolean;
  getUserById: (id: number) => User | undefined;
  adminCreateUser: (data: { name: string; email: string; password: string; role: UserRole; phone?: string }) => { user?: User; error?: string };
  adminUpdateUser: (id: number, updates: AdminUserUpdate) => { error?: string };
  adminDeleteUser: (id: number) => { error?: string };
  adminToggleSuspend: (id: number) => { error?: string };
}

const DEFAULT_ADMIN: User = {
  id: 1,
  username: 'admin',
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
        const input = email.toLowerCase();
        const user = get().users.find(
          (u) => u.email.toLowerCase() === input || u.username === input
        );
        if (!user) return null;
        if (user.suspended) return null;
        if (!verifyPassword(password, user.password)) return null;
        const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
        set((state) => ({
          currentUser: updatedUser,
          users: state.users.map((u) => (u.id === user.id ? updatedUser : u)),
        }));
        return updatedUser;
      },

      logout: () => set({ currentUser: null }),

      register: (name, email, password) => {
        const existing = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) return { error: 'A user with this email already exists' };
        const newUser: User = {
          id: get().nextUserId,
          username: generateUsername(email, get().users),
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

      updateProfile: (updates) => {
        const current = get().currentUser;
        if (!current) return { error: 'Not logged in' };
        if (updates.email && updates.email.toLowerCase() !== current.email.toLowerCase()) {
          const taken = get().users.find(
            (u) => u.id !== current.id && u.email.toLowerCase() === updates.email!.toLowerCase()
          );
          if (taken) return { error: 'A user with this email already exists' };
        }
        const updatedUser: User = {
          ...current,
          name: updates.name ?? current.name,
          email: updates.email ?? current.email,
          phone: updates.phone ?? current.phone,
          ...(updates.password ? { password: hashPassword(updates.password) } : {}),
        };
        set((state) => ({
          users: state.users.map((u) => (u.id === current.id ? updatedUser : u)),
          currentUser: updatedUser,
        }));
        return {};
      },

      isAdmin: () => get().currentUser?.role === 'admin',
      getUserById: (id) => get().users.find((u) => u.id === id),

      adminCreateUser: (data) => {
        const existing = get().users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
        if (existing) return { error: 'A user with this email already exists' };
        const newUser: User = {
          id: get().nextUserId,
          username: generateUsername(data.email, get().users),
          email: data.email,
          password: hashPassword(data.password),
          name: data.name,
          phone: data.phone,
          role: data.role,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          users: [...state.users, newUser],
          nextUserId: state.nextUserId + 1,
        }));
        return { user: newUser };
      },

      adminUpdateUser: (id, updates) => {
        const target = get().users.find((u) => u.id === id);
        if (!target) return { error: 'User not found' };
        if (updates.email && updates.email.toLowerCase() !== target.email.toLowerCase()) {
          const taken = get().users.find(
            (u) => u.id !== id && u.email.toLowerCase() === updates.email!.toLowerCase()
          );
          if (taken) return { error: 'A user with this email already exists' };
        }
        if (updates.username && updates.username !== target.username) {
          const taken = get().users.find(
            (u) => u.id !== id && u.username === updates.username!.toLowerCase()
          );
          if (taken) return { error: 'This username is already taken' };
        }
        const updatedUser: User = {
          ...target,
          name: updates.name ?? target.name,
          username: updates.username ? updates.username.toLowerCase().replace(/[^a-z0-9]/g, '') : target.username,
          email: updates.email ?? target.email,
          phone: updates.phone ?? target.phone,
          role: updates.role ?? target.role,
          ...(updates.password ? { password: hashPassword(updates.password) } : {}),
        };
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? updatedUser : u)),
          currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
        }));
        return {};
      },

      adminDeleteUser: (id) => {
        const target = get().users.find((u) => u.id === id);
        if (!target) return { error: 'User not found' };
        if (target.role === 'admin' && get().users.filter((u) => u.role === 'admin').length <= 1) {
          return { error: 'Cannot delete the last admin user' };
        }
        if (get().currentUser?.id === id) return { error: 'Cannot delete your own account' };
        set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
        return {};
      },

      adminToggleSuspend: (id) => {
        const target = get().users.find((u) => u.id === id);
        if (!target) return { error: 'User not found' };
        if (target.role === 'admin') return { error: 'Cannot suspend an admin user' };
        if (get().currentUser?.id === id) return { error: 'Cannot suspend yourself' };
        const updatedUser = { ...target, suspended: !target.suspended };
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        }));
        return {};
      },
    }),
    {
      name: 'ticket-portal-auth',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        let changed = false;
        const updatedUsers: User[] = [];
        for (const u of state.users) {
          if (!u.username) {
            changed = true;
            updatedUsers.push({ ...u, username: generateUsername(u.email, updatedUsers) });
          } else {
            updatedUsers.push(u);
          }
        }
        if (changed) {
          useAuthStore.setState({ users: updatedUsers });
        }
      },
    }
  )
);
