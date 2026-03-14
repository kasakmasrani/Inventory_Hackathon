import { Link } from 'react-router-dom';
import { HiOutlineOfficeBuilding, HiOutlineArrowRight } from 'react-icons/hi';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-100">Settings</h2>

      <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Warehouse Settings</h3>
        <p className="text-sm text-gray-400 mb-5">
          Configure warehouses and locations for multi-warehouse inventory operations.
        </p>
        <Link
          to="/warehouses"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-sm font-medium"
        >
          <HiOutlineOfficeBuilding className="w-4 h-4" />
          Open Warehouse Settings
          <HiOutlineArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
