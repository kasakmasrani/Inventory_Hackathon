import { useEffect, useState } from 'react';
import { operationsAPI } from '../services/api';
import { HiOutlineSearch } from 'react-icons/hi';

export default function LedgerPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [opFilter, setOpFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (opFilter) params.operation_type = opFilter;
    operationsAPI.ledger(params)
      .then((res) => setEntries(res.data.results || res.data))
      .catch(() => {}).finally(() => setLoading(false));
  }, [search, opFilter]);

  const opColors = {
    receipt: 'text-accent-400', delivery: 'text-danger-400',
    transfer_in: 'text-primary-400', transfer_out: 'text-warning-400',
    adjustment: 'text-purple-400',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-100">Stock Ledger</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product or reference..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-primary-800/30 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm" />
        </div>
        <select value={opFilter} onChange={(e) => setOpFilter(e.target.value)} className="px-4 py-2.5 bg-surface border border-primary-800/30 rounded-xl text-gray-200 text-sm">
          <option value="">All Operations</option>
          <option value="receipt">Receipt</option><option value="delivery">Delivery</option>
          <option value="transfer_in">Transfer In</option><option value="transfer_out">Transfer Out</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>

      <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-primary-800/30">
            {['Timestamp', 'Product', 'Operation', 'Qty Change', 'Location', 'Reference'].map((h) => (
              <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr> :
              entries.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No ledger entries</td></tr> :
              entries.map((e) => (
                <tr key={e.id} className="border-b border-primary-800/10 hover:bg-surface-light/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(e.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{e.product_name} <span className="text-gray-500 font-mono text-xs">({e.sku_code})</span></td>
                  <td className="px-6 py-4"><span className={`text-sm font-medium capitalize ${opColors[e.operation_type] || 'text-gray-400'}`}>{e.operation_type.replace('_', ' ')}</span></td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${e.quantity_change > 0 ? 'text-accent-400' : 'text-danger-400'}`}>
                      {e.quantity_change > 0 ? '+' : ''}{e.quantity_change}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{e.location_name || '—'}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{e.reference}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
