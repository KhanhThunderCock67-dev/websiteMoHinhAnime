import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShoppingBag, Check } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

export const ProductPreviewCard = ({ product }) => {
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [added, setAdded] = React.useState(false);

  const price = product.price;
  const isOutOfStock = product.stockCount <= 0;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    const res = await addToCart(
      { ...product, _id: product._id || product.id },
      1,
      isAuthenticated
    );
    if (res?.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  return (
    <div className="flex-shrink-0 w-44 rounded-xl bg-vault-950/80 border border-slate-800 hover:border-amber-500/50 transition-all p-2 flex flex-col justify-between group shadow-lg">
      <Link to={`/product/${product.slug || product.id}`} className="block relative aspect-square rounded-lg overflow-hidden bg-vault-900 mb-2">
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {product.hasDiscount && (
          <span className="absolute top-1 left-1 bg-rose-600/90 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow">
            SALE
          </span>
        )}
      </Link>

      <div className="flex-1 flex flex-col justify-between">
        <Link
          to={`/product/${product.slug || product.id}`}
          className="text-xs font-semibold text-slate-200 hover:text-amber-400 line-clamp-2 transition-colors mb-1.5"
          title={product.name}
        >
          {product.name}
        </Link>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-bold font-['Outfit'] text-amber-400">
              ${price?.toFixed(2)}
            </span>
            {isOutOfStock ? (
              <span className="text-[10px] text-rose-400 font-medium">Hết hàng</span>
            ) : (
              <span className="text-[10px] text-emerald-400 font-medium">Còn {product.stockCount}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/product/${product.slug || product.id}`}
              className="flex-1 py-1 px-2 rounded-lg bg-vault-800 hover:bg-vault-700 text-slate-200 text-[11px] font-medium text-center transition-colors flex items-center justify-center gap-1"
            >
              <span>Xem</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`p-1 rounded-lg border text-xs transition-colors flex items-center justify-center ${
                added
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
              title="Thêm vào giỏ"
            >
              {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreviewCard;
