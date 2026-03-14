import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome, HiOutlineCube, HiOutlineOfficeBuilding,
  HiOutlineClipboardList, HiOutlineTruck, HiOutlineSwitchHorizontal,
  HiOutlineAdjustments, HiOutlineUser, HiOutlineLogout, HiOutlineDocumentReport
} from 'react-icons/hi';

const links = [
  { to: '/', label: 'Dashboard', icon: HiOutlineHome },
  { to: '/products', label: 'Products', icon: HiOutlineCube },
  { to: '/warehouses', label: 'Warehouses', icon: HiOutlineOfficeBuilding },
  { to: '/receipts', label: 'Receipts', icon: HiOutlineClipboardList },
  { to: '/deliveries', label: 'Deliveries', icon: HiOutlineTruck },
  { to: '/transfers', label: 'Transfers', icon: HiOutlineSwitchHorizontal },
  { to: '/adjustments', label: 'Adjustments', icon: HiOutlineAdjustments },
  { to: '/ledger', label: 'Stock Ledger', icon: HiOutlineDocumentReport },
  { to: '/profile', label: 'Profile', icon: HiOutlineUser },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-primary-800/30 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-primary-800/30">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
          CoreInventory
        </h1>
        <p className="text-xs text-primary-300/60 mt-1">Inventory Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 mx-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/20 text-primary-300 shadow-lg shadow-primary-600/10'
                  : 'text-gray-400 hover:bg-surface-light hover:text-gray-200'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-primary-800/30">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-danger-400 hover:bg-danger-500/10 transition-all duration-200"
        >
          <HiOutlineLogout className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
