import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, AlertTriangle, Check, Layers } from 'lucide-react';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { productApi, categoryApi } from '../../api';

export const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState(getInitialFormState());
  const [modalError, setModalError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  function getInitialFormState() {
    return {
      name: '',
      brand: '',
      sku: '',
      category: '',
      subCategory: '',
      price: '',
      discountPrice: 0,
      stockCount: 10,
      images: [''],
      description: '',
      isPreOrder: false,
      releaseDate: '',
      attributes: {
        faction: '',
        scale: '',
        character: '',
        series: '',
        material: '',
        gameSystem: '',
        miniatureCount: 1,
        complexity: '',
        minPlayers: 1,
        maxPlayers: 4,
        playtimeMin: 60,
      },
    };
  }

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productApi.getAll({
          keyword: searchQuery || undefined,
          category: selectedCategory || undefined,
          limit: 50,
        }),
        categoryApi.getAll(),
      ]);
      setProducts(prodRes.data.data.products || []);
      setCategories(catRes.data.data.categories || []);
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreateModal = () => {
    setEditingProductId(null);
    setFormData(getInitialFormState());
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProductId(product._id);
    setFormData({
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      category: product.category?._id || product.category || '',
      subCategory: product.subCategory,
      price: product.price,
      discountPrice: product.discountPrice || 0,
      stockCount: product.stockCount,
      images: product.images?.length > 0 ? product.images : [''],
      description: product.description,
      isPreOrder: product.isPreOrder || false,
      releaseDate: product.releaseDate ? product.releaseDate.split('T')[0] : '',
      attributes: {
        faction: product.attributes?.faction || '',
        scale: product.attributes?.scale || '',
        character: product.attributes?.character || '',
        series: product.attributes?.series || '',
        material: product.attributes?.material || '',
        gameSystem: product.attributes?.gameSystem || '',
        miniatureCount: product.attributes?.miniatureCount || 1,
        complexity: product.attributes?.complexity || '',
        minPlayers: product.attributes?.minPlayers || 1,
        maxPlayers: product.attributes?.maxPlayers || 4,
        playtimeMin: product.attributes?.playtimeMin || 60,
      },
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      try {
        await productApi.delete(id);
        setProducts(products.filter((p) => p._id !== id));
      } catch (err) {
        alert('Failed to delete product: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    const price = Number(formData.price);
    const discountPrice = Number(formData.discountPrice) || 0;

    if (discountPrice > 0 && discountPrice >= price) {
      setModalError('Discount price must be less than the regular price');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        price,
        discountPrice,
        stockCount: Number(formData.stockCount),
        images: formData.images.filter((img) => img.trim() !== ''),
      };

      if (editingProductId) {
        await productApi.update(editingProductId, payload);
      } else {
        await productApi.create(payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save product details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit']">Product Inventory Control</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage stock allocation, pricing, and domain attributes</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Hobby Product
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-2xl bg-vault-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Filter by name, SKU, or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-3xl bg-vault-900 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Item & SKU</th>
                <th className="p-4">Discipline / Brand</th>
                <th className="p-4">Attributes</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Loading inventory records...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No products found matching query.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stockCount > 0 && p.stockCount <= 5;
                  const isOut = p.stockCount <= 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0]}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                          />
                          <div className="max-w-xs truncate">
                            <p className="font-semibold text-white truncate">{p.name}</p>
                            <span className="font-mono text-[11px] text-slate-500">{p.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-white">{p.brand}</p>
                        <p className="text-[11px] text-slate-400">{p.subCategory}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {p.attributes?.faction && (
                            <Badge variant="amber">{p.attributes.faction}</Badge>
                          )}
                          {p.attributes?.scale && (
                            <Badge variant="anime">{p.attributes.scale}</Badge>
                          )}
                          {p.attributes?.complexity && (
                            <Badge variant="cyan">{p.attributes.complexity}</Badge>
                          )}
                          {p.isPreOrder && <Badge variant="purple">Pre-Order</Badge>}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-white font-['Outfit'] text-sm">
                          ${(p.discountPrice > 0 ? p.discountPrice : p.price).toFixed(2)}
                        </p>
                        {p.discountPrice > 0 && (
                          <span className="text-[10px] text-slate-500 line-through">
                            ${p.price.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                            isOut
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                              : isLow
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : `${p.stockCount} units`}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id, p.name)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProductId ? 'Edit Product Configuration' : 'Scaffold New Hobby Product'}
        maxWidth="max-w-3xl"
      >
        {modalError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {modalError}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6 text-xs">
          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-wider text-amber-400 text-[11px]">
              1. General Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Warhammer 40k Combat Patrol or Saber Alter 1/7"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Brand / Sculptor *</label>
                <input
                  type="text"
                  required
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Alter, Games Workshop, Stonemaier"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">SKU (Stock Identifier)</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. GW-40K-SM-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Subcategory *</label>
                <input
                  type="text"
                  required
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  placeholder="Scale 1/7, Kill Team, Heavy Strategy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="font-bold uppercase tracking-wider text-emerald-400 text-[11px]">
              2. Inventory & Pricing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Retail Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Discount Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Stock Count *</label>
                <input
                  type="number"
                  required
                  value={formData.stockCount}
                  onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Domain Attributes */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="font-bold uppercase tracking-wider text-cyan-400 text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> 3. Domain Attributes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Warhammer Faction</label>
                <select
                  value={formData.attributes.faction}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attributes: { ...formData.attributes, faction: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">None / Not Applicable</option>
                  <option value="Imperium">Imperium</option>
                  <option value="Chaos">Chaos</option>
                  <option value="Xenos">Xenos</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Figure Scale</label>
                <select
                  value={formData.attributes.scale}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attributes: { ...formData.attributes, scale: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">None / Not Applicable</option>
                  <option value="1/7 Scale">1/7 Scale</option>
                  <option value="1/4 Scale">1/4 Scale</option>
                  <option value="1/6 Scale">1/6 Scale</option>
                  <option value="Nendoroid">Nendoroid</option>
                  <option value="Pop Up Parade">Pop Up Parade</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Boardgame Complexity</label>
                <select
                  value={formData.attributes.complexity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attributes: { ...formData.attributes, complexity: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">None / Not Applicable</option>
                  <option value="Light">Light</option>
                  <option value="Medium">Medium</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Image & Description */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Image URL *</label>
              <input
                type="url"
                required
                value={formData.images[0] || ''}
                onChange={(e) => setFormData({ ...formData, images: [e.target.value] })}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Product Description *</label>
              <textarea
                required
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
            >
              {isSaving ? 'Saving Product...' : editingProductId ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProductsPage;
