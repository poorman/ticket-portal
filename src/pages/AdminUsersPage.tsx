import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  User as UserIcon,
  Clock,
  Ticket,
  Search,
  X,
  Save,
  Eye,
  EyeOff,
  Ban,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/layout/AnimatedPage';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { formatDate } from '../lib/ticket-utils';
import type { User, UserRole } from '../types';

interface UserFormData {
  name: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

const emptyForm: UserFormData = { name: '', username: '', email: '', password: '', phone: '', role: 'user' };

export default function AdminUsersPage() {
  const currentUser = useRequireAuth(true);
  const users = useAuthStore((s) => s.users);
  const adminCreateUser = useAuthStore((s) => s.adminCreateUser);
  const adminUpdateUser = useAuthStore((s) => s.adminUpdateUser);
  const adminDeleteUser = useAuthStore((s) => s.adminDeleteUser);
  const adminToggleSuspend = useAuthStore((s) => s.adminToggleSuspend);
  const tickets = useTicketStore((s) => s.tickets);

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const ticketCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const t of tickets) {
      if (t.userId) {
        counts[t.userId] = (counts[t.userId] || 0) + 1;
      }
    }
    return counts;
  }, [tickets]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowAdd(true);
    setShowPassword(false);
  };

  const openEdit = (user: User) => {
    setShowAdd(false);
    setEditingId(user.id);
    setForm({
      name: user.name,
      username: user.username || '',
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role,
    });
    setShowPassword(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAdd(false);
    setForm(emptyForm);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    const result = adminCreateUser({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      role: form.role,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`User ${form.name} created`);
      setShowAdd(false);
      setForm(emptyForm);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    const updates: Record<string, string | undefined> = {};
    if (form.name) updates.name = form.name;
    if (form.username) updates.username = form.username;
    if (form.email) updates.email = form.email;
    if (form.password) updates.password = form.password;
    if (form.phone !== undefined) updates.phone = form.phone;
    updates.role = form.role;

    const result = adminUpdateUser(editingId, updates as any);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('User updated');
      setEditingId(null);
      setForm(emptyForm);
    }
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    const result = adminDeleteUser(deleteId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('User deleted');
    }
    setDeleteId(null);
  };

  const handleToggleSuspend = (user: User) => {
    const result = adminToggleSuspend(user.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(user.suspended ? `${user.name} unsuspended` : `${user.name} suspended`);
    }
  };

  const update = (field: keyof UserFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (!currentUser) return null;

  const deleteTarget = users.find((u) => u.id === deleteId);

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mb-6 no-underline"
        >
          <ArrowLeft size={14} />
          Back to admin
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-crane" />
            <div>
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="text-sm text-gray-500">{users.length} registered users</p>
            </div>
          </div>
          <button onClick={openAdd} className="btn btn-primary">
            <UserPlus size={16} />
            Add User
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or role..."
            className="input pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Add User Form */}
        {showAdd && (
          <div className="card mb-6 border border-crane/20">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <UserPlus size={16} className="text-crane" />
              Create New User
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className="input"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      className="input pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Phone (optional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => update('role', e.target.value)}
                    className="select"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  Create User
                </button>
                <button type="button" onClick={cancelEdit} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="card overflow-hidden p-0">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-gray-500 font-medium px-4 py-3">User</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Username</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Role</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Tickets</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Last Login</th>
                  <th className="text-left text-gray-500 font-medium px-4 py-3">Registered</th>
                  <th className="text-right text-gray-500 font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    {editingId === u.id ? (
                      <td colSpan={7} className="px-4 py-4">
                        <form onSubmit={handleUpdate} className="space-y-4">
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="label">Name</label>
                              <input
                                type="text"
                                value={form.name}
                                onChange={(e) => update('name', e.target.value)}
                                className="input"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="label">Username</label>
                              <input
                                type="text"
                                value={form.username}
                                onChange={(e) => update('username', e.target.value)}
                                className="input"
                                placeholder="e.g. pbieda"
                              />
                            </div>
                            <div>
                              <label className="label">Email</label>
                              <input
                                type="email"
                                value={form.email}
                                onChange={(e) => update('email', e.target.value)}
                                className="input"
                              />
                            </div>
                            <div>
                              <label className="label">New Password (leave blank to keep)</label>
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={form.password}
                                  onChange={(e) => update('password', e.target.value)}
                                  className="input pr-10"
                                  placeholder="••••••••"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="label">Phone</label>
                              <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => update('phone', e.target.value)}
                                className="input"
                              />
                            </div>
                            <div>
                              <label className="label">Role</label>
                              <select
                                value={form.role}
                                onChange={(e) => update('role', e.target.value)}
                                className="select"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button type="submit" className="btn btn-primary btn-sm">
                              <Save size={14} />
                              Save Changes
                            </button>
                            <button type="button" onClick={cancelEdit} className="btn btn-secondary btn-sm">
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                              {u.role === 'admin' ? (
                                <Shield size={14} className="text-crane" />
                              ) : (
                                <UserIcon size={14} className="text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-white font-medium truncate">{u.name}</p>
                                {u.suspended && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 shrink-0">Suspended</span>
                                )}
                              </div>
                              <p className="text-gray-500 text-xs truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-crane/80 text-sm">@{u.username}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                              u.role === 'admin'
                                ? 'bg-crane/20 text-crane'
                                : 'bg-white/[0.06] text-gray-400'
                            }`}
                          >
                            {u.role === 'admin' ? <Shield size={10} /> : <UserIcon size={10} />}
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <Ticket size={13} className="text-gray-500" />
                            {ticketCounts[u.id] || 0}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {u.lastLoginAt ? (
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-gray-500" />
                              {formatDate(u.lastLoginAt)}
                            </div>
                          ) : (
                            <span className="text-gray-600">Never</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                              title="Edit user"
                            >
                              <Pencil size={14} />
                            </button>
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleSuspend(u)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  u.suspended
                                    ? 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                                    : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10'
                                }`}
                                title={u.suspended ? 'Unsuspend user' : 'Suspend user'}
                              >
                                {u.suspended ? <CheckCircle size={14} /> : <Ban size={14} />}
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteId(u.id)}
                              disabled={u.id === currentUser.id}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={u.id === currentUser.id ? "Can't delete yourself" : 'Delete user'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-white/[0.06]">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-4">
                {editingId === u.id ? (
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Name</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => update('name', e.target.value)}
                          className="input"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="label">Username</label>
                        <input
                          type="text"
                          value={form.username}
                          onChange={(e) => update('username', e.target.value)}
                          className="input"
                          placeholder="e.g. pbieda"
                        />
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Password</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => update('password', e.target.value)}
                          className="input"
                          placeholder="Leave blank to keep"
                        />
                      </div>
                      <div>
                        <label className="label">Phone</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => update('phone', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Role</label>
                        <select
                          value={form.role}
                          onChange={(e) => update('role', e.target.value)}
                          className="select"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn btn-primary btn-sm">
                        <Save size={14} /> Save
                      </button>
                      <button type="button" onClick={cancelEdit} className="btn btn-secondary btn-sm">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                        {u.role === 'admin' ? (
                          <Shield size={15} className="text-crane" />
                        ) : (
                          <UserIcon size={15} className="text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium truncate">{u.name}</p>
                          {u.suspended && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Suspended</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs truncate">{u.email}</p>
                        {u.username && (
                          <p className="text-crane/60 text-xs truncate">@{u.username}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                              u.role === 'admin' ? 'bg-crane/20 text-crane' : 'bg-white/[0.06] text-gray-400'
                            }`}
                          >
                            {u.role}
                          </span>
                          <span className="flex items-center gap-1">
                            <Ticket size={11} /> {ticketCounts[u.id] || 0} tickets
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06]"
                      >
                        <Pencil size={14} />
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleSuspend(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.suspended
                              ? 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10'
                          }`}
                        >
                          {u.suspended ? <CheckCircle size={14} /> : <Ban size={14} />}
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteId(u.id)}
                        disabled={u.id === currentUser.id}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              {search ? 'No users match your search.' : 'No users found.'}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name || 'this user'}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AnimatedPage>
  );
}
