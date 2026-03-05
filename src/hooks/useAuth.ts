import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const register = useAuthStore((s) => s.register);

  return {
    user: currentUser,
    isLoggedIn: !!currentUser,
    isAdmin: isAdmin(),
    login,
    logout,
    register,
  };
}
