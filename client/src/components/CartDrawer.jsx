import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export const CartDrawer = () => {
  const navigate = useNavigate();
  const { isOpen, setIsOpen, items, updateQuantity, removeItem, getTotalPrice, getTotalCount } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();

  if (!isOpen) return null;

  const totalPrice = getTotalPrice();
  const totalCount = getTotalCount();

  const handleCheckoutClick = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-vault-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white font-['Outfit']">Your Cart</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                {totalCount}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-200">Your cart is empty</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Explore our exclusive anime scale figures, Warhammer 40k miniatures, and board games.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  Start Browsing
                </button>
              </div>
            ) : (
              items.map((item) => {
                const product = item.product || {};
                const effectivePrice =
                  item.price || product.discountPrice || product.price || 0;
                const itemId = item._id;

                return (
                  <div
                    key={itemId}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex gap-3.5 items-center"
                  >
                    <img
                      src={
                        product.images?.[0] ||
                        'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=256&q=80'
                      }
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-amber-500/90 font-semibold truncate">
                        {product.brand}
                      </p>
                      <h4 className="text-sm font-semibold text-slate-100 truncate leading-tight mt-0.5">
                        {product.name}
                      </h4>
                      <p className="text-xs font-bold text-white font-['Outfit'] mt-1">
                        ${effectivePrice.toFixed(2)}
                      </p>

                      {/* Quantity Selector & Remove */}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
                          <button
                            onClick={() =>
                              updateQuantity(itemId, item.quantity - 1, isAuthenticated)
                            }
                            disabled={item.quantity <= 1}
                            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-semibold text-slate-200 px-2.5">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(itemId, item.quantity + 1, isAuthenticated)
                            }
                            disabled={product.stockCount && item.quantity >= product.stockCount}
                            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(itemId, isAuthenticated)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-800 bg-slate-950/80 space-y-4">
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-200 font-['Outfit'] text-sm">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="text-emerald-400 font-medium">Free on orders $99+</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Estimated Total</span>
                <span className="text-xl font-extrabold text-white font-['Outfit']">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
