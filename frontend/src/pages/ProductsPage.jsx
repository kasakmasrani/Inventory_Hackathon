import { useEffect, useState } from 'react';
import { productsAPI } from '../services/api';
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    product_name: '', sku_code: '', category: '', unit_of_measure: 'pcs',
    initial_stock: 0, reorder_level: 10, description: ''
  });

  const fetchProducts = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (filterCat) params.category = filterCat;
    productsAPI.list(params)
      .then((res) => setProducts(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    productsAPI.categories().then((res) => setCategories(res.data.results || res.data)).catch(() => {});
  }, [search, filterCat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await productsAPI.update(editing, form);
      } else {
        await productsAPI.create(form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ product_name: '', sku_code: '', category: '', unit_of_measure: 'pcs', initial_stock: 0, reorder_level: 10, description: '' });
      fetchProducts();
    } catch (err) {
      alert(JSON.stringify(err.response?.data || 'Error'));
    }
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({
      product_name: p.product_name, sku_code: p.sku_code,
      category: p.category || '', unit_of_measure: p.unit_of_measure,
      initial_stock: p.initial_stock, reorder_level: p.reorder_level,
      description: p.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await productsAPI.delete(id);
    fetchProducts();
  };

  const inputClass = "w-full px-4 py-2.5 bg-surface-light border border-primary-800/30 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-all text-sm";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Products</h2>
        <button onClick={() => { setEditing(null); setForm({ product_name: '', sku_code: '', category: '', unit_of_measure: 'pcs', initial_stock: 0, reorder_level: 10, description: '' }); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-600/25 text-sm">
          <HiOutlinePlus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-primary-800/30 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-primary-800/30 rounded-xl text-gray-200 focus:outline-none focus:border-primary-500 text-sm">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-800/30">
                {['Product', 'SKU', 'Category', 'Unit', 'Stock', 'Reorder Level', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No products found</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-primary-800/10 hover:bg-surface-light/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-200">{p.product_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">{p.sku_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{p.category_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 uppercase">{p.unit_of_measure}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${(p.total_stock || 0) <= p.reorder_level ? (p.total_stock || 0) === 0 ? 'text-danger-400' : 'text-warning-400' : 'text-accent-400'}`}>
                        {p.total_stock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{p.reorder_level}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(p)} className="p-2 hover:bg-primary-600/20 rounded-lg transition-colors"><HiOutlinePencil className="w-4 h-4 text-primary-400" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-danger-500/20 rounded-lg transition-colors"><HiOutlineTrash className="w-4 h-4 text-danger-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-primary-800/30 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-gray-100 mb-6">{editing ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Product Name *</label>
                <input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} required className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">SKU Code *</label>
                  <input value={form.sku_code} onChange={(e) => setForm({ ...form, sku_code: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                    <option value="">None</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
                  <select value={form.unit_of_measure} onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })} className={inputClass}>
                    <option value="pcs">Pieces</option><option value="kg">Kg</option><option value="ltr">Litres</option>
                    <option value="m">Meters</option><option value="box">Boxes</option><option value="set">Sets</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Initial Stock</label>
                  <input type="number" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Reorder Level</label>
                  <input type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputClass} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl transition-all text-sm">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-surface-light text-gray-300 rounded-xl hover:bg-surface-lighter transition-all text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
