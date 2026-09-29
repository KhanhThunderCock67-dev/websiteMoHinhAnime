import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Truck, Clock, ShieldCheck } from 'lucide-react';
import Badge from '../components/Badge';
import { orderApi } from '../api';

export const OrderSuccessPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!order);

  useEffect(() => {
    if (!order && id) {
      const fetchOrder = async () => {
        try {
          const res = await orderApi.getById(id);
          setOrder(res.data.data.order);
        } catch (err) {
          console.error('Failed to load order:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, order]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500" />
      </div>
    );
  }

  const stages = ['pending', 'confirmed', 'shipping', 'completed'];
  const currentStageIndex = stages.indexOf(order?.orderStatus || 'pending');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Confirmation Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-vault-900 border border-slate-800 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            Order Successfully Placed!
          </h1>
          <p className="text-sm text-slate-400">
            Order reference: <strong className="text-amber-400 font-mono">#{order?._id}</strong>
          </p>
          <p className="text-xs text-slate-500">
            Stock has been allocated in the warehouse. We are prepping your mint collector packaging.
          </p>
        </div>

        {/* Status Pipeline Visualizer */}
        <div className="pt-6 pb-2">
          <div className="relative flex items-center justify-between max-w-xl mx-auto">
            {/* Horizontal connection line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-amber-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%`,
              }}
            />

            {stages.map((stage, idx) => {
              const isPassed = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage} className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-900 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isCurrent
                        ? 'text-amber-400'
                        : isPassed
                        ? 'text-slate-200'
                        : 'text-slate-500'
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/orders"
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
          >
            Track All Orders
          </Link>
          <Link
            to="/catalog"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            Continue Browsing
          </Link>
        </div>
      </div>

      {/* Order Summary & Destination */}
      {order && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400" /> Shipping Destination
            </h3>
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Payment & Totals
            </h3>
            <div className="text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-semibold text-white">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status:</span>
                <span className="text-emerald-400 font-semibold">
                  {order.isPaid ? 'Paid' : 'Pending Verification'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-sm font-bold text-white">
                <span>Total Amount:</span>
                <span className="text-amber-400 font-['Outfit']">${order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccessPage;
