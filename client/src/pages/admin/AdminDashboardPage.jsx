import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import Badge from '../../components/Badge';
import { orderApi, productApi } from '../../api';

export const AdminDashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, lowStockRes] = await Promise.all([
          orderApi.getAnalytics(),
          productApi.getLowStock(5),
        ]);
        setAnalytics(analyticsRes.data.data);
        setLowStockProducts(lowStockRes.data.data.products || []);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500" />
      </div>
    );
  }

  const metrics = analytics?.metrics || {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
  };
  const statusBreakdown = analytics?.statusBreakdown || {};
  const recentOrders = analytics?.recentOrders || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            Operations & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time hobby store performance, stock levels, and fulfillment pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            Manage Products
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
          >
            Fulfillment Pipeline
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            ${metrics.totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Settled orders
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            {metrics.totalOrders}
          </p>
          <p className="text-[11px] text-slate-400">All customer shipments</p>
        </div>

        <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Catalog Items
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            {metrics.totalProducts}
          </p>
          <p className="text-[11px] text-slate-400">Figures, 40k & Boardgames</p>
        </div>

        <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-['Outfit']">
            {metrics.lowStockCount}
          </p>
          <p className="text-[11px] text-rose-400/80 font-semibold">Under 5 units in warehouse</p>
        </div>
      </div>

      {/* Orders Status Pipeline Overview */}
      <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white font-['Outfit']">Fulfillment Pipeline Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Pending', count: statusBreakdown.pending || 0, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
            { label: 'Confirmed', count: statusBreakdown.confirmed || 0, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
            { label: 'Shipping', count: statusBreakdown.shipping || 0, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
            { label: 'Completed', count: statusBreakdown.completed || 0, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
            { label: 'Cancelled', count: statusBreakdown.cancelled || 0, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
          ].map((item) => (
            <div key={item.label} className={`p-4 rounded-2xl border ${item.color} text-center space-y-1`}>
              <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
              <p className="text-2xl font-extrabold font-['Outfit']">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Low Stock Alert Items & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Low Stock Warning List
            </h2>
            <Link to="/admin/products" className="text-xs text-amber-400 hover:underline">
              View All Products
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">All product inventory healthy.</p>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.map((p) => (
                <div
                  key={p._id}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 truncate">
                    <img
                      src={p.images?.[0]}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-white truncate">{p.name}</p>
                      <p className="text-slate-400 text-[11px]">{p.brand} • SKU: {p.sku}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold shrink-0">
                    {p.stockCount} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> Recent Customer Orders
            </h2>
            <Link to="/admin/orders" className="text-xs text-cyan-400 hover:underline">
              View Pipeline
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No orders recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {recentOrders.map((o) => (
                <div
                  key={o._id}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="truncate">
                    <p className="font-bold text-white font-mono">#{o._id.slice(-6)}</p>
                    <p className="text-slate-400 truncate">{o.user?.name || o.shippingAddress?.fullName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-amber-400 font-['Outfit']">${o.totalPrice.toFixed(2)}</p>
                    <span className="text-[10px] uppercase font-bold text-slate-300">{o.orderStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
