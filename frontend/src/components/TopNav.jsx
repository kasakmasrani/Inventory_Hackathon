import { useAuth } from '../context/AuthContext';
import { HiOutlineBell } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { operationsAPI } from '../services/api';

export default function TopNav({ title }) {
  const { user } = useAuth();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    operationsAPI.alerts({ resolved: 'false' })
      .then((res) => setAlertCount(res.data.results?.length || res.data.length || 0))
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-primary-800/20 flex items-center justify-between px-8 sticky top-0 z-40">
      <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
      <div className="flex items-center gap-4">
        {/* Alert bell */}
        <div className="relative">
          <HiOutlineBell className="w-6 h-6 text-gray-400 hover:text-primary-400 cursor-pointer transition-colors" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
              {alertCount}
            </span>
          )}
        </div>
        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-primary-800/30">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white">
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">
              {user?.first_name || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
