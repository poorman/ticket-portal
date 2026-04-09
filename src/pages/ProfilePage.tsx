import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Save, X, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const user = useRequireAuth();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!user) return null;

  const close = () => navigate(-1);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const updates: { name?: string; email?: string; phone?: string; password?: string } = {};
    if (name !== user.name) updates.name = name;
    if (email !== user.email) updates.email = email;
    if (phone !== (user.phone || '')) updates.phone = phone;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) {
      toast('No changes to save');
      return;
    }

    const result = await updateProfile(updates);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Profile updated');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg mx-4 card relative"
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold text-white mb-5">Profile</h2>

        {/* Avatar upload */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-gray-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
            >
              <Camera size={18} className="text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
                const reader = new FileReader();
                reader.onload = async () => {
                  const result = await updateAvatar(reader.result as string);
                  if (result.error) toast.error(result.error);
                  else toast.success('Avatar updated');
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>
          <div>
            <p className="text-sm text-white font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">@{user.username}</p>
            <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-crane hover:text-crane-light mt-1 cursor-pointer">
              Upload photo
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Phone</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                className="input pl-10"
              />
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-5">
            <p className="text-xs text-gray-500 mb-3">Leave blank to keep current password</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    className="input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2">
            <Save size={15} />
            Save Changes
          </button>
        </form>
      </motion.div>
    </div>
  );
}
