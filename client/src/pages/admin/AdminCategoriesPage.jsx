import React, { useEffect, useState } from 'react';
import { Plus, Trash2, FolderTree, Tag } from 'lucide-react';
import Modal from '../../components/Modal';
import { categoryApi } from '../../api';

export const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newSubCategories, setNewSubCategories] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const res = await categoryApi.getAll();
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const subs = newSubCategories
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await categoryApi.create({
        name: newCatName,
        slug: newCatSlug || newCatName.toLowerCase().replace(/\s+/g, '-'),
        description: newCatDescription,
        subCategories: subs,
      });

      setIsModalOpen(false);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDescription('');
      setNewSubCategories('');
      loadCategories();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete category "${name}"?`)) {
      try {
        await categoryApi.delete(id);
        setCategories(categories.filter((c) => c._id !== id));
      } catch (err) {
        alert('Failed to delete category: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit']">Category Taxonomies</h1>
          <p className="text-xs text-slate-400 mt-0.5">Configure main hobby departments and subcategories</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="p-6 rounded-3xl bg-vault-900 border border-slate-800 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FolderTree className="w-5 h-5" />
                </span>
                <button
                  onClick={() => handleDelete(cat._id, cat.name)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">{cat.name}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{cat.description}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                Subcategories ({cat.subCategories?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cat.subCategories?.map((sub, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-slate-950 text-slate-300 border border-slate-800"
                  >
                    <Tag className="w-3 h-3 text-amber-500" />
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Category Discipline"
      >
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Card Games & Accessories"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Slug</label>
            <input
              type="text"
              value={newCatSlug}
              onChange={(e) => setNewCatSlug(e.target.value)}
              placeholder="card-games"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Description</label>
            <textarea
              rows="2"
              value={newCatDescription}
              onChange={(e) => setNewCatDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Subcategories (comma separated)
            </label>
            <input
              type="text"
              value={newSubCategories}
              onChange={(e) => setNewSubCategories(e.target.value)}
              placeholder="Deck Building, Trading Cards, Sleeves"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold"
            >
              Create Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCategoriesPage;
