import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export const CartPage = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, getTotalCount } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();

  const totalPrice = getTotalPrice();
  const totalCount = getTotalCount();
  const shippingFee = totalPrice >= 99 ? 0 : 9.99;
  const grandTotal = totalPrice + shippingFee;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-vault-900 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white font-['Outfit']">Your Cart is Currently Empty</h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Discover our curated collection of scale figures, miniatures, and board games.
        </p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all"
        >
          Browse Catalog
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-['Outfit']">Shopping Cart</h1>
          <p className="text-xs text-slate-400 mt-1">{totalCount} collector items reserved</p>
        </div>
        <button
          onClick={() => clearCart(isAuthenticated)}
          className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = item.product || {};
            const effectivePrice = item.price || product.discountPrice || product.price || 0;
            const itemId = item._id;

            return (
              <div
                key={itemId}
                className="p-5 rounded-3xl bg-vault-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-5 justify-between"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=256&q=80'}
                    alt={product.name}
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-800 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                      {product.brand}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xs">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      SKU: <strong className="text-slate-300">{product.sku}</strong>
                    </p>
                  </div>
                </div>

                {/* Pricing & Controls */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(itemId, item.quantity - 1, isAuthenticated)}
                      disabled={item.quantity <= 1}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(itemId, item.quantity + 1, isAuthenticated)}
                      disabled={product.stockCount && item.quantity >= product.stockCount}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[90px]">
                    <p className="text-base font-extrabold text-white font-['Outfit']">
                      ${(effectivePrice * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      ${effectivePrice.toFixed(2)} ea
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(itemId, isAuthenticated)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Checkout Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white font-['Outfit']">Order Summary</h2>

            <div className="space-y-2.5 text-xs text-slate-300 divide-y divide-slate-800/80">
              <div className="flex justify-between pt-1">
                <span>Items Subtotal</span>
                <span className="font-bold text-white font-['Outfit'] text-sm">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span>Insured Collector Shipping</span>
                <span className={shippingFee === 0 ? 'text-emerald-400 font-bold' : 'font-bold text-white'}>
                  {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span>Estimated Sales Tax</span>
                <span className="text-slate-400 font-medium">Calculated at checkout</span>
              </div>
              <div className="flex justify-between pt-3 text-base font-extrabold text-white">
                <span>Estimated Total</span>
                <span className="text-xl text-amber-400 font-['Outfit']">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-vault-900/40 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Bank-grade 256-bit encrypted checkout with verified stock allocation.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
