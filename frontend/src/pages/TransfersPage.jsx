import { useEffect, useState } from 'react';
import { operationsAPI, productsAPI, warehousesAPI } from '../services/api';
import { HiOutlinePlus, HiOutlineCheckCircle } from 'react-icons/hi';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ reference: '', product: '', from_location: '', to_location: '', quantity: 1, notes: '' });

  const fetchTransfers = () => {
    setLoading(true);
    operationsAPI.transfers({}).then((res) => setTransfers(res.data.results || res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransfers();
    productsAPI.list({ page_size: 100 }).then((res) => setProducts(res.data.results || res.data)).catch(() => {});
    warehousesAPI.locations({}).then((res) => setLocations(res.data.results || res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await operationsAPI.createTransfer(form);
      setShowModal(false);
      setForm({ reference: '', product: '', from_location: '', to_location: '', quantity: 1, notes: '' });
      fetchTransfers();
    } catch (err) { alert(JSON.stringify(err.response?.data || 'Error')); }
  };

  const handleComplete = async (id) => {
    if (!confirm('Complete this transfer?')) return;
    try { await operationsAPI.completeTransfer(id); fetchTransfers(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const statusColors = { draft: 'bg-gray-500/20 text-gray-400', in_transit: 'bg-warning-500/20 text-warning-400', done: 'bg-accent-500/20 text-accent-400', cancelled: 'bg-danger-500/20 text-danger-400' };
  const inputClass = "w-full px-4 py-2.5 bg-surface-light border border-primary-800/30 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-all text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Internal Transfers</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-xl text-sm shadow-lg">
          <HiOutlinePlus className="w-4 h-4" /> New Transfer
        </button>
      </div>

      <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-primary-800/30">
            {['Reference', 'Product', 'From', 'To', 'Qty', 'Status', 'Actions'].map((h) => (
              <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr> :
              transfers.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No transfers</td></tr> :
              transfers.map((t) => (
                <tr key={t.id} className="border-b border-primary-800/10 hover:bg-surface-light/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-teal-400">{t.reference}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{t.product_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{t.from_location_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{t.to_location_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 font-semibold">{t.quantity}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[t.status] || ''}`}>{t.status}</span></td>
                  <td className="px-6 py-4">
                    {t.status !== 'done' && t.status !== 'cancelled' && (
                      <button onClick={() => handleComplete(t.id)} className="flex items-center gap-1 px-3 py-1.5 bg-accent-500/20 text-accent-400 rounded-lg text-xs font-medium hover:bg-accent-500/30">
                        <HiOutlineCheckCircle className="w-4 h-4" /> Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-primary-800/30 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-gray-100 mb-6">New Transfer</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Reference *</label><input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required className={inputClass} placeholder="TRF-001" /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Product *</label>
                <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required className={inputClass}>
                  <option value="">Select...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.product_name} ({p.sku_code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-300 mb-1">From Location *</label>
                  <select value={form.from_location} onChange={(e) => setForm({ ...form, from_location: e.target.value })} required className={inputClass}>
                    <option value="">Select...</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.warehouse_name} → {l.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-300 mb-1">To Location *</label>
                  <select value={form.to_location} onChange={(e) => setForm({ ...form, to_location: e.target.value })} required className={inputClass}>
                    <option value="">Select...</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.warehouse_name} → {l.name}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Quantity *</label><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} required className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-xl text-sm">Create Transfer</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-surface-light text-gray-300 rounded-xl text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
