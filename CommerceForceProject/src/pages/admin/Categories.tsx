import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  AlertCircle, 
  Loader2, 
  Package, 
  Edit3,
  X,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  product_count: number;
}

export const CategoriesAdmin = () => {
  const { token, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: ''
  });
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCategories();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}` 
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchCategories();
        handleCloseModal();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save category');
      }
    } catch (err) {
      setError('An error occurred while saving.');
    }
  };

  const handleDelete = async (id: number) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    
    if (cat.product_count > 0) {
      alert(`Cannot delete category "${cat.name}" because it contains ${cat.product_count} products. Move or delete the products first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', image_url: '' });
    setError(null);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin opacity-20" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-black/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all shadow-sm"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--primary-color)] text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[var(--primary-color)]/20"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-black/5 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-black/5 text-[#141414] text-[10px] font-mono uppercase tracking-widest">
              <th className="p-6 font-bold">Category Name</th>
              <th className="p-6 font-bold">Slug</th>
              <th className="p-6 font-bold">Products</th>
              <th className="p-6 font-bold">Usage</th>
              <th className="p-6 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filteredCategories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center">
                      <Layers size={14} className="opacity-40" />
                    </div>
                    <span className="text-sm font-bold">{category.name}</span>
                  </div>
                </td>
                <td className="p-6 text-xs font-mono text-[#141414]/60">{category.slug}</td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="opacity-30" />
                    <span className="text-sm font-bold">{category.product_count}</span>
                  </div>
                </td>
                <td className="p-6">
                  {category.product_count === 0 ? (
                    <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full font-bold bg-amber-50 text-amber-600">
                      Empty
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full font-bold bg-green-50 text-green-600">
                      In Use
                    </span>
                  )}
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(category)}
                      className="p-2 hover:bg-black/5 rounded-xl transition-all"
                      title="Edit Category"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id)}
                      className={`p-2 rounded-xl transition-all ${
                        category.product_count > 0 
                          ? 'opacity-20 cursor-not-allowed' 
                          : 'hover:bg-red-50 text-red-500'
                      }`}
                      title={category.product_count > 0 ? "Cannot delete category with products" : "Delete Category"}
                      disabled={category.product_count > 0}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[24px] shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#141414]">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                    placeholder="e.g. Industrial Tools"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all min-h-[100px]"
                    placeholder="Brief description of the category..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-1.5 ml-1">Category Image URL</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={e => setFormData({...formData, image_url: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 bg-[#f5f5f5] text-[#141414] rounded-xl font-bold hover:bg-[#ebebeb] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#141414] text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
