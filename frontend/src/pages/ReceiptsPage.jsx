import { useEffect, useState } from 'react';
import { operationsAPI, productsAPI, warehousesAPI } from '../services/api';
import { HiOutlinePlus, HiOutlineCheckCircle } from 'react-icons/hi';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ reference: '', supplier: '', location: '', notes: '', items: [{ product: '', quantity: 1 }] });

  const fetchReceipts = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    operationsAPI.receipts(params)
      .then((res) => setReceipts(res.data.results || res.data))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReceipts();
    productsAPI.list({ page_size: 100 }).then((res) => setProducts(res.data.results || res.data)).catch(() => {});
    warehousesAPI.locations({}).then((res) => setLocations(res.data.results || res.data)).catch(() => {});
  }, [statusFilter]);

  const addItem = () => setForm({ ...form, items: [...form.items, { product: '', quantity: 1 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i][field] = field === 'quantity' ? parseInt(val) || 0 : val;
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await operationsAPI.createReceipt(form);
      setShowModal(false);
      setForm({ reference: '', supplier: '', location: '', notes: '', items: [{ product: '', quantity: 1 }] });
      fetchReceipts();
    } catch (err) { alert(JSON.stringify(err.response?.data || 'Error')); }
  };

  const handleValidate = async (id) => {
    if (!confirm('Validate this receipt? Stock will be updated.')) return;
    try {
      await operationsAPI.validateReceipt(id);
      fetchReceipts();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const statusColors = { draft: 'bg-gray-500/20 text-gray-400', waiting: 'bg-warning-500/20 text-warning-400', ready: 'bg-primary-500/20 text-primary-400', done: 'bg-accent-500/20 text-accent-400', cancelled: 'bg-danger-500/20 text-danger-400' };
  const inputClass = "w-full px-4 py-2.5 bg-surface-light border border-primary-800/30 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-all text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Receipts (Incoming Stock)</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-medium rounded-xl text-sm shadow-lg shadow-accent-600/25">
          <HiOutlinePlus className="w-4 h-4" /> New Receipt
        </button>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-surface border border-primary-800/30 rounded-xl text-gray-200 text-sm">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option><option value="waiting">Waiting</option>
          <option value="ready">Ready</option><option value="done">Done</option><option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-primary-800/30">
            {['Reference', 'Supplier', 'Location', 'Status', 'Items', 'Date', 'Actions'].map((h) => (
              <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : receipts.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No receipts</td></tr>
            ) : receipts.map((r) => (
              <tr key={r.id} className="border-b border-primary-800/10 hover:bg-surface-light/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-primary-400">{r.reference}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{r.supplier}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{r.location_name || '—'}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[r.status] || ''}`}>{r.status}</span></td>
                <td className="px-6 py-4 text-sm text-gray-400">{r.items?.length || 0}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  {r.status !== 'done' && r.status !== 'cancelled' && (
                    <button onClick={() => handleValidate(r.id)} className="flex items-center gap-1 px-3 py-1.5 bg-accent-500/20 text-accent-400 rounded-lg text-xs font-medium hover:bg-accent-500/30 transition-colors">
                      <HiOutlineCheckCircle className="w-4 h-4" /> Validate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-primary-800/30 rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-100 mb-6">New Receipt</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Reference *</label><input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required className={inputClass} placeholder="REC-001" /></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Supplier *</label><input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} required className={inputClass} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1">Location *</label>
                <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required className={inputClass}>
                  <option value="">Select location...</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.warehouse_name} → {l.name}</option>)}
                </select>
              </div>

              <div className="border-t border-primary-800/20 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-300">Items</h4>
                  <button type="button" onClick={addItem} className="text-xs text-primary-400 hover:text-primary-300">+ Add item</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-3 mb-2 items-end">
                    <div className="flex-1">
                      <select value={item.product} onChange={(e) => updateItem(i, 'product', e.target.value)} required className={inputClass}>
                        <option value="">Select product...</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.product_name} ({p.sku_code})</option>)}
                      </select>
                    </div>
                    <div className="w-24"><input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} required className={inputClass} /></div>
                    {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="px-2 py-2 text-danger-400 hover:bg-danger-500/10 rounded-lg text-sm">✕</button>}
                  </div>
                ))}
              </div>

              <div><label className="block text-sm font-medium text-gray-300 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-medium rounded-xl text-sm">Create Receipt</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-surface-light text-gray-300 rounded-xl text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
