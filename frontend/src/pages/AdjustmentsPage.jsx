import { useEffect, useState } from 'react';
import { operationsAPI, productsAPI, warehousesAPI } from '../services/api';
import { HiOutlinePlus } from 'react-icons/hi';

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ reference: '', product: '', location: '', counted_quantity: 0, reason: 'count', notes: '' });

  const fetchAdjustments = () => {
    setLoading(true);
    operationsAPI.adjustments({}).then((res) => setAdjustments(res.data.results || res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdjustments();
    productsAPI.list({ page_size: 100 }).then((res) => setProducts(res.data.results || res.data)).catch(() => {});
    warehousesAPI.locations({}).then((res) => setLocations(res.data.results || res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await operationsAPI.createAdjustment(form);
      setShowModal(false);
      setForm({ reference: '', product: '', location: '', counted_quantity: 0, reason: 'count', notes: '' });
      fetchAdjustments();
    } catch (err) { alert(JSON.stringify(err.response?.data || 'Error')); }
  };

  const inputClass = "w-full px-4 py-2.5 bg-surface-light border border-primary-800/30 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-all text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Inventory Adjustments</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-warning-500 to-warning-600 text-white font-medium rounded-xl text-sm shadow-lg">
          <HiOutlinePlus className="w-4 h-4" /> New Adjustment
        </button>
      </div>

      <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-primary-800/30">
            {['Reference', 'Product', 'Location', 'System Qty', 'Counted', 'Difference', 'Reason', 'Date'].map((h) => (
              <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr> :
              adjustments.length === 0 ? <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No adjustments</td></tr> :
              adjustments.map((a) => (
                <tr key={a.id} className="border-b border-primary-800/10 hover:bg-surface-light/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-warning-400">{a.reference}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{a.product_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{a.location_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{a.system_quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 font-semibold">{a.counted_quantity}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold ${a.difference > 0 ? 'text-accent-400' : a.difference < 0 ? 'text-danger-400' : 'text-gray-400'}`}>
                      {a.difference > 0 ? '+' : ''}{a.difference}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 capitalize">{a.reason}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-primary-800/30 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-gray-100 mb-6">New Adjustment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Reference *</label><input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required className={inputClass} placeholder="ADJ-001" /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Product *</label>
                <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required className={inputClass}>
                  <option value="">Select...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.product_name} ({p.sku_code})</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Location *</label>
                <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required className={inputClass}>
                  <option value="">Select...</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.warehouse_name} → {l.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Counted Quantity *</label><input type="number" min="0" value={form.counted_quantity} onChange={(e) => setForm({ ...form, counted_quantity: parseInt(e.target.value) || 0 })} required className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Reason</label>
                  <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass}>
                    <option value="count">Physical Count</option><option value="damaged">Damaged</option><option value="lost">Lost</option><option value="found">Found</option><option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-warning-500 to-warning-600 text-white font-medium rounded-xl text-sm">Create Adjustment</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-surface-light text-gray-300 rounded-xl text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
