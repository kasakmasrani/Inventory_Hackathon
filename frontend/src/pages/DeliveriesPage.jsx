import { useEffect, useState } from 'react';
import { operationsAPI, productsAPI, warehousesAPI } from '../services/api';
import { HiOutlinePlus, HiOutlineCheckCircle } from 'react-icons/hi';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ reference: '', customer: '', location: '', notes: '', items: [{ product: '', quantity: 1 }] });

  const fetchDeliveries = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    operationsAPI.deliveries(params)
      .then((res) => setDeliveries(res.data.results || res.data))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeliveries();
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
      await operationsAPI.createDelivery(form);
      setShowModal(false);
      setForm({ reference: '', customer: '', location: '', notes: '', items: [{ product: '', quantity: 1 }] });
      fetchDeliveries();
    } catch (err) { alert(JSON.stringify(err.response?.data || 'Error')); }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'pick') await operationsAPI.pickDelivery(id);
      else if (action === 'pack') await operationsAPI.packDelivery(id);
      else if (action === 'validate') {
        if (!confirm('Validate delivery? Stock will decrease.')) return;
        await operationsAPI.validateDelivery(id);
      }
      fetchDeliveries();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const statusColors = { draft: 'bg-gray-500/20 text-gray-400', picking: 'bg-primary-500/20 text-primary-400', packing: 'bg-warning-500/20 text-warning-400', ready: 'bg-accent-500/20 text-accent-400', done: 'bg-accent-500/20 text-accent-400', cancelled: 'bg-danger-500/20 text-danger-400' };
  const inputClass = "w-full px-4 py-2.5 bg-surface-light border border-primary-800/30 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-all text-sm";

  const getActions = (d) => {
    const actions = [];
    if (['draft', 'waiting'].includes(d.status)) actions.push({ label: 'Pick', action: 'pick', color: 'bg-primary-500/20 text-primary-400' });
    if (d.status === 'picking') actions.push({ label: 'Pack', action: 'pack', color: 'bg-warning-500/20 text-warning-400' });
    if (['packing', 'ready'].includes(d.status)) actions.push({ label: 'Validate', action: 'validate', color: 'bg-accent-500/20 text-accent-400' });
    return actions;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Delivery Orders (Outgoing Stock)</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-xl text-sm shadow-lg">
          <HiOutlinePlus className="w-4 h-4" /> New Delivery
        </button>
      </div>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-surface border border-primary-800/30 rounded-xl text-gray-200 text-sm">
        <option value="">All Statuses</option>
        <option value="draft">Draft</option><option value="picking">Picking</option><option value="packing">Packing</option>
        <option value="ready">Ready</option><option value="done">Done</option><option value="cancelled">Cancelled</option>
      </select>

      <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-primary-800/30">
            {['Reference', 'Customer', 'Location', 'Status', 'Items', 'Date', 'Actions'].map((h) => (
              <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr> :
              deliveries.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No deliveries</td></tr> :
              deliveries.map((d) => (
                <tr key={d.id} className="border-b border-primary-800/10 hover:bg-surface-light/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-purple-400">{d.reference}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{d.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{d.location_name || '—'}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[d.status] || ''}`}>{d.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-400">{d.items?.length || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {getActions(d).map((a) => (
                        <button key={a.action} onClick={() => handleAction(d.id, a.action)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${a.color} hover:opacity-80 transition-opacity`}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-primary-800/30 rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-100 mb-6">New Delivery Order</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Reference *</label><input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required className={inputClass} placeholder="DEL-001" /></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Customer *</label><input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required className={inputClass} /></div>
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
                  <button type="button" onClick={addItem} className="text-xs text-primary-400">+ Add item</button>
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
                    {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="px-2 py-2 text-danger-400 rounded-lg text-sm">✕</button>}
                  </div>
                ))}
              </div>

              <div><label className="block text-sm font-medium text-gray-300 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-xl text-sm">Create Delivery</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-surface-light text-gray-300 rounded-xl text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
