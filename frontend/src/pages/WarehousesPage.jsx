import { useEffect, useState } from 'react';
import { warehousesAPI } from '../services/api';
import { HiOutlinePlus, HiOutlineLocationMarker } from 'react-icons/hi';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWHModal, setShowWHModal] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [whForm, setWhForm] = useState({ name: '', address: '' });
  const [locForm, setLocForm] = useState({ warehouse: '', name: '', description: '' });

  const fetchWarehouses = () => {
    setLoading(true);
    warehousesAPI.list()
      .then((res) => setWarehouses(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWarehouses(); }, []);

  const createWarehouse = async (e) => {
    e.preventDefault();
    try {
      await warehousesAPI.create(whForm);
      setShowWHModal(false);
      setWhForm({ name: '', address: '' });
      fetchWarehouses();
    } catch (err) { alert(JSON.stringify(err.response?.data || 'Error')); }
  };

  const createLocation = async (e) => {
    e.preventDefault();
    try {
      await warehousesAPI.createLocation(locForm);
      setShowLocModal(false);
      setLocForm({ warehouse: '', name: '', description: '' });
      fetchWarehouses();
    } catch (err) { alert(JSON.stringify(err.response?.data || 'Error')); }
  };

  const inputClass = "w-full px-4 py-2.5 bg-surface-light border border-primary-800/30 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-all text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Warehouses</h2>
        <div className="flex gap-3">
          <button onClick={() => setShowWHModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl transition-all text-sm shadow-lg shadow-primary-600/25">
            <HiOutlinePlus className="w-4 h-4" /> New Warehouse
          </button>
          <button onClick={() => setShowLocModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-medium rounded-xl transition-all text-sm shadow-lg shadow-accent-600/25">
            <HiOutlineLocationMarker className="w-4 h-4" /> New Location
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : warehouses.length === 0 ? (
        <div className="bg-surface/80 border border-primary-800/20 rounded-2xl p-12 text-center text-gray-500">No warehouses yet. Create one to get started.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {warehouses.map((wh) => (
            <div key={wh.id} className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl p-6 hover:border-primary-700/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-100">{wh.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${wh.is_active ? 'bg-accent-500/20 text-accent-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {wh.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {wh.address && <p className="text-sm text-gray-400 mb-4">{wh.address}</p>}
              <div className="text-xs text-gray-500 mb-3">{wh.location_count || wh.locations?.length || 0} Locations</div>
              {wh.locations && wh.locations.length > 0 && (
                <div className="space-y-2">
                  {wh.locations.map((loc) => (
                    <div key={loc.id} className="flex items-center justify-between p-3 bg-dark-900/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <HiOutlineLocationMarker className="w-4 h-4 text-primary-400" />
                        <span className="text-sm text-gray-300">{loc.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {loc.stock_items?.length || 0} items
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Warehouse Modal */}
      {showWHModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-primary-800/30 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-100 mb-6">New Warehouse</h3>
            <form onSubmit={createWarehouse} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Name *</label><input value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} required className={inputClass} placeholder="Main Warehouse" /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Address</label><textarea value={whForm.address} onChange={(e) => setWhForm({ ...whForm, address: e.target.value })} rows={2} className={inputClass} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl text-sm">Create</button>
                <button type="button" onClick={() => setShowWHModal(false)} className="px-6 py-2.5 bg-surface-light text-gray-300 rounded-xl text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Location Modal */}
      {showLocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-primary-800/30 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-100 mb-6">New Location</h3>
            <form onSubmit={createLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Warehouse *</label>
                <select value={locForm.warehouse} onChange={(e) => setLocForm({ ...locForm, warehouse: e.target.value })} required className={inputClass}>
                  <option value="">Select...</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Location Name *</label><input value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} required className={inputClass} placeholder="Rack A" /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Description</label><input value={locForm.description} onChange={(e) => setLocForm({ ...locForm, description: e.target.value })} className={inputClass} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-medium rounded-xl text-sm">Create</button>
                <button type="button" onClick={() => setShowLocModal(false)} className="px-6 py-2.5 bg-surface-light text-gray-300 rounded-xl text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
