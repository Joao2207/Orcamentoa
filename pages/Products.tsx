
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Product, ProductMode, CompanySettings, Category } from '../types';
import { Search, Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle, XCircle, AlertTriangle, Share2, Tag } from 'lucide-react';

interface ProductsProps {
  settings: CompanySettings | null;
}

const Products: React.FC<ProductsProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    costPrice: 0,
    description: '',
    unit: 'unidade',
    photoBase64: '',
    categoryId: undefined,
    active: true
  });

  const loadData = async () => {
    const [pList, cList] = await Promise.all([
      db.products.toArray(),
      db.categories.toArray()
    ]);
    setProducts(pList);
    setCategories(cList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData } as Product;
    if (editingProduct?.id) {
      await db.products.update(editingProduct.id, dataToSave);
    } else {
      await db.products.add(dataToSave);
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const toggleActive = async (product: Product) => {
    await db.products.update(product.id!, { active: !product.active });
    loadData();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCompleteMode = settings?.productMode === ProductMode.COMPLETE;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Catálogo</h2>
          <p className="text-gray-500 font-medium">Gestão de produtos e precificação.</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', price: 0, costPrice: 0, description: '', unit: 'unidade', photoBase64: '', active: true });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all"
        >
          <Plus className="mr-2 h-6 w-6 inline" /> NOVO PRODUTO
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar produto..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all ${!product.active ? 'opacity-60 grayscale' : 'hover:shadow-xl'}`}>
            {isCompleteMode && product.photoBase64 && (
              <div className="h-48 overflow-hidden">
                <img src={product.photoBase64} alt={product.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-black text-lg text-gray-900">{product.name}</h3>
                  {product.categoryId && (
                    <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                      {categories.find(c => c.id === product.categoryId)?.name || 'Geral'}
                    </span>
                  )}
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => handleEdit(product)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => toggleActive(product)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl">
                    {product.active ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-2xl font-black text-indigo-600">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                {product.costPrice && product.costPrice > 0 && (
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                    Margem: {(((product.price - product.costPrice) / product.price) * 100).toFixed(0)}% (Interno)
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-indigo-600 p-6 text-white"><h3 className="text-xl font-black uppercase tracking-tight">{editingProduct ? 'Editar' : 'Novo'} Produto</h3></div>
            <form onSubmit={handleSave} className="p-8 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Nome *</label>
                  <input required type="text" className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Preço Venda *</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Custo (Interno)</label>
                  <input type="number" step="0.01" className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Categoria</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: parseInt(e.target.value)})}>
                    <option value="">Nenhuma</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-500 font-black uppercase text-xs">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg shadow-indigo-100">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
