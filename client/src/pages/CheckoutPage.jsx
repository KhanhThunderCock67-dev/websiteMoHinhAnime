import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, DollarSign, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../store/localeStore';
import { useCurrencyStore } from '../store/currencyStore';
import { orderApi } from '../api';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const { currency, usdToVndRate, formatPrice } = useCurrencyStore();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.shippingAddress?.fullName || user?.name || '',
    phone: user?.shippingAddress?.phone || '',
    street: user?.shippingAddress?.street || '',
    city: user?.shippingAddress?.city || '',
    state: user?.shippingAddress?.state || '',
    postalCode: user?.shippingAddress?.postalCode || '',
    country: user?.shippingAddress?.country || 'USA',
  });

  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const itemsPrice = getTotalPrice();
  const shippingPrice = itemsPrice >= 99 ? 0 : 9.99;
  const taxPrice = Math.round(itemsPrice * 0.08 * 100) / 100;
  const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white font-display">{t('cart.emptyTitle', null, 'No items in your cart to checkout')}</h2>
        <Link
          to="/catalog"
          className="inline-block px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
        >
          {t('catalog.title', null, 'Return to Catalog')}
        </Link>
      </div>
    );
  }

  const handleInputChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isAuthenticated) {
      setErrorMsg(t('auth.loginRequired', null, 'Please sign in or register before completing your order so your package can be tracked.'));
      return;
    }

    if (
      !shippingAddress.fullName ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode
    ) {
      setErrorMsg(t('common.error', null, 'Please complete all required shipping fields'));
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        orderItems: items.map((item) => ({
          product: item.product?._id || item.product,
          name: item.product?.name || 'Collector Piece',
          image: item.product?.images?.[0] || '',
          price: item.price || item.product?.discountPrice || item.product?.price || 0,
          quantity: item.quantity,
          sku: item.product?.sku || '',
        })),
        shippingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        currency,
        exchangeRate: usdToVndRate,
      };

      const response = await orderApi.create(orderPayload);
      const createdOrder = response.data.data.order;

      // Clear local / store cart
      await clearCart(isAuthenticated);

      navigate(`/order-success/${createdOrder._id}`, { state: { order: createdOrder } });
    } catch (err) {
      console.error('Order creation error:', err);
      setErrorMsg(
        err.response?.data?.message || 'Failed to place order. A product stock change may have occurred.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('checkout.backToCart', null, 'Back to Cart')}
        </Link>
        <h1 className="text-3xl font-extrabold text-white font-display">{t('checkout.title', null, 'Collector Checkout')}</h1>
        <p className="text-xs text-slate-400 mt-1">{t('checkout.subtitle', null, 'Review shipping coordinates and confirm stock allocation')}</p>
      </div>

      {!isAuthenticated && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs sm:text-sm text-amber-200">
              {t('checkout.guestWarning', null, 'You are checking out as a guest. Sign in to link this order to your collector profile and access tracking.')}
            </p>
          </div>
          <Link
            to="/login?redirect=/checkout"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition-all"
          >
            {t('nav.login', null, 'Sign In Now')}
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Cols: Shipping & Payment */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Shipping Address */}
          <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs flex items-center justify-center font-bold">
                1
              </span>
              {t('checkout.shippingInfo', null, 'Shipping Destination')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('checkout.fullName', null, 'Recipient Full Name *')}
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={shippingAddress.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('checkout.phone', null, 'Phone Number')}
                </label>
                <input
                  type="text"
                  name="phone"
                  value={shippingAddress.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('checkout.country', null, 'Country')}
                </label>
                <input
                  type="text"
                  name="country"
                  value={shippingAddress.country}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('checkout.street', null, 'Street Address *')}
                </label>
                <input
                  type="text"
                  name="street"
                  required
                  value={shippingAddress.street}
                  onChange={handleInputChange}
                  placeholder="Street, Suite, Apt"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('checkout.city', null, 'City *')}
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={shippingAddress.city}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('checkout.state', null, 'State *')}
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={shippingAddress.state}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('checkout.postalCode', null, 'ZIP Code *')}
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    value={shippingAddress.postalCode}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Payment Method */}
          <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs flex items-center justify-center font-bold">
                2
              </span>
              {t('checkout.paymentMethod', null, 'Payment Instrument')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'Credit Card', name: t('checkout.creditCard', null, 'Credit / Debit Card'), icon: CreditCard },
                { id: 'PayPal', name: t('checkout.paypal', null, 'PayPal Express'), icon: ShieldCheck },
                { id: 'Cash on Delivery', name: t('checkout.cod', null, 'Cash on Delivery (COD)'), icon: DollarSign },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col items-center justify-center text-center gap-2 transition-all ${
                    paymentMethod === method.id
                      ? 'bg-amber-500/15 border-amber-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <method.icon className={`w-5 h-5 ${paymentMethod === method.id ? 'text-amber-400' : ''}`} />
                  <span className="text-xs font-semibold">{method.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Order Breakdown & Submit */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white font-display">{t('checkout.orderSummary', { count: items.length }, 'Order Summary')}</h2>

            {/* Micro items list */}
            <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-800/80">
              {items.map((item) => (
                <div key={item._id} className="pt-2 flex items-center justify-between text-xs gap-3">
                  <div className="truncate">
                    <p className="font-semibold text-white truncate">{item.product?.name}</p>
                    <p className="text-slate-400">{t('cart.quantity', null, 'Qty')}: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-white font-display shrink-0">
                    {formatPrice((item.price || item.product?.discountPrice || item.product?.price || 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-slate-800">
              <div className="flex justify-between">
                <span>{t('cart.subtotal', null, 'Items Subtotal')}</span>
                <span className="font-bold text-white font-display text-sm">
                  {formatPrice(itemsPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('cart.shipping', null, 'Shipping')}</span>
                <span className="text-emerald-400 font-bold">
                  {shippingPrice === 0 ? t('cart.freeShipping', null, 'FREE') : formatPrice(shippingPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('cart.tax', null, 'State & Local Tax (8%)')}</span>
                <span className="font-bold text-white font-display">
                  {formatPrice(taxPrice)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-extrabold text-white">
                <span>{t('cart.grandTotal', null, 'Grand Total')}</span>
                <span className="text-xl text-amber-400 font-display">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {isSubmitting
                ? t('checkout.authorizing', null, 'Processing Payment & Allocating Stock...')
                : t('checkout.authorizeBtn', { amount: formatPrice(totalPrice) }, `Authorize & Place Order (${formatPrice(totalPrice)})`)}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;

