import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Check, AlertCircle } from 'lucide-react';
import Badge from './Badge';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const isLowStock = product.stockCount > 0 && product.stockCount <= 5;
  const isOutOfStock = product.stockCount <= 0;
  const hasDiscount = product.discountPrice > 0;
  const price = hasDiscount ? product.discountPrice : product.price;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    const result = await addToCart(product, 1, isAuthenticated);
    setIsAdding(false);

    if (result.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
  };

  // Determine faction badge variant
  const getFactionVariant = (faction) => {
    if (faction === 'Imperium') return 'imperium';
    if (faction === 'Chaos') return 'chaos';
    if (faction === 'Xenos') return 'xenos';
    return 'amber';
  };

  return (
    <div className="group relative rounded-2xl bg-vault-900 border border-slate-800/90 hover:border-slate-700/80 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 flex flex-col overflow-hidden">
      {/* Product Image Area */}
      <Link
        to={`/product/${product.slug || product._id}`}
        className="relative block aspect-[4/5] overflow-hidden bg-vault-950/60"
      >
        <img
          src={
            product.images?.[0] ||
            'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80'
          }
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-vault-900/90 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
          <div className="flex flex-col gap-1.5 items-start">
            {product.isPreOrder && (
              <Badge variant="purple" className="shadow-lg backdrop-blur-md">
                Pre-Order
              </Badge>
            )}
            {hasDiscount && (
              <Badge variant="danger" className="shadow-lg font-bold">
                SALE -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
              </Badge>
            )}
          </div>

          {/* Domain Specific Pill */}
          <div>
            {product.attributes?.faction && (
              <Badge
                variant={getFactionVariant(product.attributes.faction)}
                className="backdrop-blur-md"
              >
                {product.attributes.faction}
              </Badge>
            )}
            {product.attributes?.scale && !product.attributes?.faction && (
              <Badge variant="anime" className="backdrop-blur-md">
                {product.attributes.scale}
              </Badge>
            )}
            {product.attributes?.complexity && !product.attributes?.scale && !product.attributes?.faction && (
              <Badge variant="cyan" className="backdrop-blur-md">
                {product.attributes.complexity} Strategy
              </Badge>
            )}
          </div>
        </div>

        {/* Stock Alert Overlay if Out of Stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider border border-slate-700">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Brand & Category info */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium text-amber-500/90 uppercase tracking-wider text-[11px] truncate max-w-[140px]">
              {product.brand}
            </span>
            <span className="text-slate-500 text-[11px] truncate max-w-[120px]">
              {product.subCategory}
            </span>
          </div>

          {/* Title */}
          <Link
            to={`/product/${product.slug || product._id}`}
            className="block text-sm sm:text-base font-semibold text-slate-100 hover:text-amber-400 line-clamp-2 transition-colors mb-2 leading-snug"
          >
            {product.name}
          </Link>
        </div>

        {/* Pricing, Stock status, & CTA Button */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-bold font-['Outfit'] text-white">
                  ${price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-slate-500 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Stock micro-indicator */}
              {isLowStock ? (
                <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                  <AlertCircle className="w-3 h-3" /> Only {product.stockCount} left
                </span>
              ) : !isOutOfStock ? (
                <span className="text-[11px] text-emerald-400 font-medium">In Stock</span>
              ) : null}
            </div>

            {/* Quick Rating preview */}
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-200">{product.rating || 5.0}</span>
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
              isOutOfStock
                ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
                : addedSuccess
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-amber-400 active:scale-[0.98]'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Added to Cart
              </>
            ) : isOutOfStock ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                {product.isPreOrder ? 'Pre-Order Now' : 'Add to Cart'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
