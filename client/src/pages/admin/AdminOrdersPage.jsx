import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import Modal from '../../components/Modal';
import { orderApi } from '../../api';
import { useTranslation } from '../../store/localeStore';
import { useCurrencyStore } from '../../store/currencyStore';

export const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const { t } = useTranslation();
  const { formatPrice } = useCurrencyStore();

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderApi.getAll({ status: selectedStatus || undefined, limit: 50 });
      setOrders(res.data.data.orders || []);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedStatus]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await orderApi.updateStatus(
        orderId,
        newStatus,
        `Status updated to ${newStatus} by operations team`
      );
      setOrders(
        orders.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openDetails = (order) => {
    setActiveOrder(order);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-display">{t('adminOrders.title', null, 'Order Pipeline & Fulfillment')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('adminOrders.subtitle', null, 'Manage tracking stages from confirmation through dispatch')}</p>
        </div>

        {/* Filter status pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-vault-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
          {['', 'pending', 'confirmed', 'shipping', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold uppercase text-[10px] tracking-wider transition-all ${
                selectedStatus === st
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st ? t(`userOrders.status${st.charAt(0).toUpperCase() + st.slice(1)}`, null, st) : t('adminOrders.filterAll', null, 'All Orders')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-vault-900 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">{t('adminOrders.orderId', null, 'Reference')}</th>
                <th className="p-4">{t('adminOrders.customer', null, 'Customer')}</th>
                <th className="p-4">{t('adminOrders.items', null, 'Items Count')}</th>
                <th className="p-4">{t('adminOrders.total', null, 'Total Amount')}</th>
                <th className="p-4">{t('adminOrders.status', null, 'Pipeline Status')}</th>
                <th className="p-4 text-right">{t('adminOrders.actions', null, 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    {t('common.loading', null, 'Loading orders...')}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    {t('adminDashboard.noOrders', null, 'No orders in this status category.')}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-white">#{order._id.slice(-8)}</td>
                    <td className="p-4">
                      <p className="font-semibold text-white">
                        {order.shippingAddress?.fullName || order.user?.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{order.user?.email}</p>
                    </td>
                    <td className="p-4">
                      {order.orderItems?.reduce((acc, i) => acc + i.quantity, 0)} {t('adminOrders.items', null, 'items')}
                    </td>
                    <td className="p-4 font-bold text-amber-400 font-display text-sm">
                      {formatPrice(order.totalPrice, order.currency)}
                    </td>
                    <td className="p-4">
                      <select
                        value={order.orderStatus}
                        disabled={updatingOrderId === order._id}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`bg-slate-950 border rounded-xl px-2.5 py-1 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                          order.orderStatus === 'completed'
                            ? 'border-emerald-500/40 text-emerald-400'
                            : order.orderStatus === 'shipping'
                            ? 'border-cyan-500/40 text-cyan-400'
                            : order.orderStatus === 'cancelled'
                            ? 'border-rose-500/40 text-rose-400'
                            : 'border-amber-500/40 text-amber-400'
                        }`}
                      >
                        <option value="pending">{t('userOrders.statusPending', null, 'Pending')}</option>
                        <option value="confirmed">{t('userOrders.statusConfirmed', null, 'Confirmed')}</option>
                        <option value="shipping">{t('userOrders.statusShipping', null, 'Shipping')}</option>
                        <option value="completed">{t('userOrders.statusCompleted', null, 'Completed')}</option>
                        <option value="cancelled">{t('userOrders.statusCancelled', null, 'Cancelled')}</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openDetails(order)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title={t('adminOrders.viewDetails', null, 'View Details')}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={activeOrder ? `${t('adminOrders.orderDetails', { id: activeOrder._id }, `Order Details #${activeOrder._id}`)}` : 'Order View'}
      >
        {activeOrder && (
          <div className="space-y-6 text-xs text-slate-300">
            {/* Customer & Address */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <p className="font-bold uppercase text-[10px] text-slate-500 mb-1">{t('adminOrders.customer', null, 'Customer')}</p>
                <p className="font-bold text-white text-sm">{activeOrder.shippingAddress?.fullName}</p>
                <p className="text-slate-400">{activeOrder.shippingAddress?.phone}</p>
              </div>
              <div>
                <p className="font-bold uppercase text-[10px] text-slate-500 mb-1">{t('orderSuccess.shippingTo', null, 'Shipping To')}</p>
                <p>{activeOrder.shippingAddress?.street}</p>
                <p>
                  {activeOrder.shippingAddress?.city}, {activeOrder.shippingAddress?.state}{' '}
                  {activeOrder.shippingAddress?.postalCode}
                </p>
                <p>{activeOrder.shippingAddress?.country}</p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <p className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">
                {t('adminOrders.items', null, 'Order Items')} ({activeOrder.orderItems.length})
              </p>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1 divide-y divide-slate-800">
                {activeOrder.orderItems.map((item, idx) => (
                  <div key={idx} className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate">
                      <img
                        src={item.image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover border border-slate-800"
                      />
                      <div className="truncate">
                        <p className="font-semibold text-white truncate">{item.name}</p>
                        <p className="text-slate-500">
                          {t('cart.quantity', null, 'Qty')}: {item.quantity} • {formatPrice(item.price, activeOrder.currency)} {t('cart.itemPrice', null, 'each')}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-white font-display">
                      {formatPrice(item.price * item.quantity, activeOrder.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Timeline */}
            {activeOrder.statusTimeline?.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">
                  {t('userOrders.timelineUpdates', null, 'Timeline Updates')}
                </p>
                <div className="space-y-1">
                  {activeOrder.statusTimeline.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="font-bold text-white uppercase text-[10px]">
                        [{step.status}]
                      </span>
                      <span className="text-slate-400">{step.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline text-sm">
              <span className="font-bold text-slate-300">{t('cart.grandTotal', null, 'Grand Total')}</span>
              <span className="text-lg font-extrabold text-amber-400 font-display">
                {formatPrice(activeOrder.totalPrice, activeOrder.currency)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrdersPage;

