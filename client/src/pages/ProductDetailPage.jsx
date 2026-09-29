import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  AlertCircle,
  Plus,
  Minus,
  Calendar,
  Layers,
  Users,
  Clock,
  Swords,
} from 'lucide-react';
import Badge from '../components/Badge';
import ProductCard from '../components/ProductCard';
import { productApi } from '../api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const response = await productApi.getBySlug(slug);
        const data = response.data.data;
        setProduct(data.product);
        setRelatedProducts(data.relatedProducts || []);
        setSelectedImage(0);
        setQuantity(1);
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white">Collector piece not found</h2>
        <Link
          to="/catalog"
          className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isLowStock = product.stockCount > 0 && product.stockCount <= 5;
  const isOutOfStock = product.stockCount <= 0;
  const hasDiscount = product.discountPrice > 0;
  const price = hasDiscount ? product.discountPrice : product.price;

  const handleAddToCart = async () => {
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    const res = await addToCart(product, quantity, isAuthenticated);
    setIsAdding(false);

    if (res.success) {
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Product Primary Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-vault-900 border border-slate-800 shadow-2xl">
            <img
              src={
                product.images?.[selectedImage] ||
                'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80'
              }
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            {product.isPreOrder && (
              <div className="absolute top-4 left-4">
                <Badge variant="purple" className="text-xs px-3 py-1 font-bold shadow-lg">
                  Official Pre-Order
                </Badge>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === idx
                      ? 'border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Top metadata tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                {product.brand}
              </span>
              <span className="text-xs text-slate-400">{product.subCategory}</span>

              {product.attributes?.faction && (
                <Badge
                  variant={
                    product.attributes.faction === 'Imperium'
                      ? 'imperium'
                      : product.attributes.faction === 'Chaos'
                      ? 'chaos'
                      : 'xenos'
                  }
                >
                  {product.attributes.faction}
                </Badge>
              )}

              {product.attributes?.scale && (
                <Badge variant="anime">{product.attributes.scale}</Badge>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-['Outfit'] leading-tight">
              {product.name}
            </h1>

            {/* SKU and Rating */}
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>
                SKU: <strong className="text-slate-200">{product.sku}</strong>
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-200">{product.rating}</span>
                <span>({product.numReviews} collector reviews)</span>
              </div>
            </div>

            {/* Price & Discount */}
            <div className="p-4 rounded-2xl bg-vault-900 border border-slate-800/80 flex items-baseline gap-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">
                ${price.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-slate-500 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                  <Badge variant="danger" className="font-bold">
                    SAVE ${(product.price - product.discountPrice).toFixed(2)}
                  </Badge>
                </>
              )}
            </div>

            {/* Pre-Order Date / Stock Banner */}
            {product.isPreOrder && product.releaseDate && (
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3 text-purple-300">
                <Calendar className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Scheduled Release Date</h4>
                  <p className="text-sm font-semibold">
                    {new Date(product.releaseDate).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Stock Level status */}
            <div className="text-sm">
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-rose-400 font-semibold">
                  <AlertCircle className="w-4 h-4" /> Currently Out of Stock
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <AlertCircle className="w-4 h-4" /> Low Stock Alert: Only {product.stockCount} units remaining
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Check className="w-4 h-4" /> In Stock & Ready to Ship ({product.stockCount} available)
                </div>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center bg-vault-900 border border-slate-700 rounded-xl p-1 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-white">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stockCount, quantity + 1))
                  }
                  disabled={quantity >= product.stockCount || isOutOfStock}
                  className="p-2.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className={`flex-1 w-full py-3.5 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 ${
                  isOutOfStock
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : addSuccess
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-xl shadow-amber-500/25 hover:scale-[1.01]'
                }`}
              >
                {addSuccess ? (
                  <>
                    <Check className="w-5 h-5" /> Added to Your Cart
                  </>
                ) : isOutOfStock ? (
                  'Sold Out'
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    {product.isPreOrder ? 'Reserve Pre-Order Now' : 'Add to Cart'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Value Props Box */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-vault-900/60 border border-slate-800 text-center">
            <div className="space-y-1">
              <ShieldCheck className="w-5 h-5 text-amber-400 mx-auto" />
              <p className="text-[11px] font-semibold text-slate-300">100% Authentic</p>
            </div>
            <div className="space-y-1 border-x border-slate-800">
              <Truck className="w-5 h-5 text-cyan-400 mx-auto" />
              <p className="text-[11px] font-semibold text-slate-300">Collector Box</p>
            </div>
            <div className="space-y-1">
              <RotateCcw className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-[11px] font-semibold text-slate-300">Mint Guarantee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Specifications & Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
            <h3 className="text-xl font-bold text-white font-['Outfit']">Collector Overview</h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>

        {/* Technical Attributes Table */}
        <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" /> Specifications
          </h3>
          <div className="space-y-3 text-xs divide-y divide-slate-800">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Manufacturer / Brand</span>
              <span className="font-semibold text-slate-200">{product.brand}</span>
            </div>
            {product.attributes?.material && (
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Material</span>
                <span className="font-semibold text-slate-200">{product.attributes.material}</span>
              </div>
            )}
            {product.attributes?.character && (
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Character</span>
                <span className="font-semibold text-pink-400">{product.attributes.character}</span>
              </div>
            )}
            {product.attributes?.series && (
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Series</span>
                <span className="font-semibold text-slate-200">{product.attributes.series}</span>
              </div>
            )}
            {product.attributes?.faction && (
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Warhammer Faction</span>
                <span className="font-semibold text-amber-400">{product.attributes.faction}</span>
              </div>
            )}
            {product.attributes?.miniatureCount && (
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Miniature Count</span>
                <span className="font-semibold text-slate-200">{product.attributes.miniatureCount} plastic models</span>
              </div>
            )}
            {product.attributes?.complexity && (
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Game Complexity</span>
                <span className="font-semibold text-emerald-400">{product.attributes.complexity}</span>
              </div>
            )}
            {product.attributes?.minPlayers && (
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Player Count</span>
                <span className="font-semibold text-slate-200">
                  {product.attributes.minPlayers} - {product.attributes.maxPlayers} Players
                </span>
              </div>
            )}
            {product.attributes?.playtimeMin && (
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Average Playtime</span>
                <span className="font-semibold text-slate-200">{product.attributes.playtimeMin} minutes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="pt-10 border-t border-slate-800 space-y-6">
          <h2 className="text-2xl font-bold text-white font-['Outfit']">Related Acquisitions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel._id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
