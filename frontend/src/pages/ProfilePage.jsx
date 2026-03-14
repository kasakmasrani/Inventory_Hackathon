import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await authAPI.updateProfile(form);
      setMessage('Profile updated successfully!');
      localStorage.setItem('user', JSON.stringify({ ...user, ...form }));
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-surface-light border border-primary-800/30 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-100">Profile</h2>

      <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl p-8">
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-primary-800/20">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white">
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-100">
              {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email}
            </h3>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <span className="inline-block mt-1 px-3 py-1 bg-primary-600/20 text-primary-400 text-xs font-medium rounded-full capitalize">{user?.role}</span>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-3 rounded-xl text-sm ${message.includes('success') ? 'bg-accent-500/10 border border-accent-500/30 text-accent-400' : 'bg-danger-500/10 border border-danger-500/30 text-danger-400'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input value={user?.email || ''} disabled className="w-full px-4 py-3 bg-dark-900/50 border border-primary-800/20 rounded-xl text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <input value={user?.role || ''} disabled className="w-full px-4 py-3 bg-dark-900/50 border border-primary-800/20 rounded-xl text-gray-500 cursor-not-allowed capitalize" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Joined</label>
            <input value={user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : ''} disabled className="w-full px-4 py-3 bg-dark-900/50 border border-primary-800/20 rounded-xl text-gray-500 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-600/25 disabled:opacity-50 mt-4">
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
