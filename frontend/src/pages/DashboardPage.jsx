import { useEffect, useState } from 'react';
import { dashboardAPI, operationsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { HiOutlineCube, HiOutlineExclamation, HiOutlineClipboardList, HiOutlineTruck, HiOutlineSwitchHorizontal, HiOutlineBell } from 'react-icons/hi';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl p-6 hover:border-primary-700/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary-900/20">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-bold text-gray-100">{value}</span>
      </div>
      <p className="text-sm font-medium text-gray-300">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.stats(),
      dashboardAPI.charts(),
      operationsAPI.alerts({ resolved: 'false' }),
    ])
      .then(([s, c, a]) => {
        setStats(s.data);
        setCharts(c.data);
        setAlerts(a.data.results || a.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard title="Total Products" value={stats.total_products || 0} icon={HiOutlineCube} color="bg-gradient-to-br from-primary-600 to-primary-500" />
        <StatsCard title="Low Stock Items" value={stats.low_stock_count || 0} icon={HiOutlineExclamation} color="bg-gradient-to-br from-warning-500 to-warning-600" subtitle="Below reorder level" />
        <StatsCard title="Out of Stock" value={stats.out_of_stock_count || 0} icon={HiOutlineExclamation} color="bg-gradient-to-br from-danger-500 to-danger-600" />
        <StatsCard title="Active Alerts" value={stats.active_alerts || 0} icon={HiOutlineBell} color="bg-gradient-to-br from-danger-400 to-danger-500" />
        <StatsCard title="Pending Receipts" value={stats.pending_receipts || 0} icon={HiOutlineClipboardList} color="bg-gradient-to-br from-accent-500 to-accent-600" />
        <StatsCard title="Pending Deliveries" value={stats.pending_deliveries || 0} icon={HiOutlineTruck} color="bg-gradient-to-br from-purple-500 to-purple-600" />
        <StatsCard title="Pending Transfers" value={stats.pending_transfers || 0} icon={HiOutlineSwitchHorizontal} color="bg-gradient-to-br from-teal-500 to-teal-600" />
        <StatsCard title="Total Stock Units" value={stats.total_stock || 0} icon={HiOutlineCube} color="bg-gradient-to-br from-indigo-500 to-indigo-600" />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-danger-500/10 border border-danger-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-danger-400 mb-3 flex items-center gap-2">
            <HiOutlineBell className="w-5 h-5" /> Stock Alerts
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-dark-900/50 rounded-xl text-sm">
                <span className="text-gray-300">
                  <strong className="text-danger-400">{a.product_name || a.sku_code}</strong> — Stock: {a.current_stock} (Reorder: {a.reorder_level})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Stock by Category</h3>
          {charts.category_distribution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={charts.category_distribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {charts.category_distribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1640', border: '1px solid #4338ca', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">No data yet</p>
          )}
        </div>

        {/* Movement History */}
        <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Stock Movement (30 Days)</h3>
          {charts.movement_history?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.movement_history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2766" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: '#1a1640', border: '1px solid #4338ca', borderRadius: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="inbound" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="outbound" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">No movements yet</p>
          )}
        </div>

        {/* Warehouse Comparison */}
        <div className="bg-surface/80 backdrop-blur border border-primary-800/20 rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Warehouse Stock Comparison</h3>
          {charts.warehouse_comparison?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.warehouse_comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2766" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: '#1a1640', border: '1px solid #4338ca', borderRadius: '12px' }} />
                <Bar dataKey="stock" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4338ca" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">No warehouses yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
