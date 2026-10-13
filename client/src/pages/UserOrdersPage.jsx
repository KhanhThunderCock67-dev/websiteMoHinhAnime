import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import Badge from '../components/Badge';
import { orderApi } from '../api';
import { useTranslation, useLocaleStore } from '../store/localeStore';
import { useCurrencyStore } from '../store/currencyStore';

export const UserOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const { language } = useLocaleStore();
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderApi.getMyOrders();
        setOrders(response.data.data.orders || []);
      } catch (err) {
        console.error('Failed to load user orders:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">{t('userOrders.statusCompleted', null, 'Completed / Delivered')}</Badge>;
      case 'shipping':
        return <Badge variant="cyan">{t('userOrders.statusShipping', null, 'In Transit')}</Badge>;
      case 'confirmed':
        return <Badge variant="amber">{t('userOrders.statusConfirmed', null, 'Order Confirmed')}</Badge>;
      case 'cancelled':
        return <Badge variant="danger">{t('userOrders.statusCancelled', null, 'Cancelled')}</Badge>;
      default:
        return <Badge variant="warning">{t('userOrders.statusPending', null, 'Pending Confirmation')}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white font-display">{t('userOrders.title', null, 'My Collector Orders')}</h1>
        <p className="text-xs text-slate-400 mt-1">{t('userOrders.subtitle', null, 'Track shipments and status timeline history')}</p>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">{t('userOrders.emptyTitle', null, 'No past orders found')}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {t('userOrders.emptyDesc', null, "You haven't made any acquisitions yet. Start your collection today!")}
          </p>
          <Link
            to="/catalog"
            className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-md hover:bg-amber-400 transition-all"
          >
            {t('userOrders.exploreCatalog', null, 'Explore Catalog')}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-400">{t('userOrders.orderRef', null, 'Order Reference')}</span>
                  <p className="font-mono text-sm font-bold text-white">#{order._id}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t('userOrders.datePlaced', null, 'Date Placed')}</span>
                  <p className="text-xs text-slate-200">
                    {new Date(order.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t('userOrders.totalAmount', null, 'Total Price')}</span>
                  <p className="text-sm font-extrabold text-amber-400 font-display">
                    {formatPrice(order.totalPrice, order.currency)}
                  </p>
                </div>
                <div>{getStatusBadge(order.orderStatus)}</div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {order.orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.image ||
                          'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=128&q=80'
                        }
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                      />
                      <div>
                        <p className="font-semibold text-white truncate max-w-sm">{item.name}</p>
                        <p className="text-slate-400">
                          {t('cart.quantity', null, 'Qty')}: {item.quantity} • {formatPrice(item.price, order.currency)} {t('cart.itemPrice', null, 'each')}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-white font-display">
                      {formatPrice(item.price * item.quantity, order.currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status Timeline History Preview */}
              {order.statusTimeline?.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    {t('userOrders.timelineUpdates', null, 'Timeline Updates')}
                  </span>
                  <div className="space-y-1.5">
                    {order.statusTimeline.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-slate-300 font-medium uppercase text-[10px]">
                          [{step.status}]
                        </span>
                        <span className="text-slate-400 truncate">{step.note}</span>
                        <span className="text-slate-500 ml-auto text-[10px]">
                          {new Date(step.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrdersPage;

