
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Product, ProductMode, CompanySettings, Category } from '../types';
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react';

interface ProductsProps {
  settings: CompanySettings | null;
}

const Products: React.FC<ProductsProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    costPrice: 0,
    description: '',
    unit: 'unid',
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
    await loadData();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir este produto do catálogo permanentemente?')) {
      await db.products.delete(id);
      await loadData();
    }
  };

  const toggleActive = async (product: Product) => {
    await db.products.update(product.id!, { active: !product.active });
    await loadData();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCompleteMode = settings?.productMode === ProductMode.COMPLETE;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase leading-none mb-1">Catálogo Elite</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">Curadoria de produtos e precificação estratégica.</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', price: 0, costPrice: 0, description: '', unit: 'unid', photoBase64: '', active: true });
            setIsModalOpen(true);
          }}
          className="bg-indigo-950 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center hover:bg-blue-600 transition-all shadow-xl active:scale-95 text-xs tracking-widest"
        >
          <Plus className="mr-2 h-5 w-5" /> NOVO PRODUTO
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
        <input
          type="text"
          placeholder="Buscar produto no catálogo..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => (
          <div key={product.id} className={`bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:border-blue-50 group ${!product.active ? 'opacity-40 grayscale' : ''}`}>
            {isCompleteMode && product.photoBase64 && (
              <div className="h-48 overflow-hidden relative">
                <img src={product.photoBase64} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/20 to-transparent"></div>
              </div>
            )}
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-black text-xl text-indigo-950 truncate mb-1">{product.name}</h3>
                  {product.categoryId && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {categories.find(c => c.id === product.categoryId)?.name || 'Geral'}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90" title="Editar"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => toggleActive(product)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all active:scale-90" title={product.active ? "Desativar" : "Ativar"}>
                    {product.active ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4" />}
                  </button>
                  <button onClick={() => handleDelete(product.id!)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all active:scale-90" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              
              <div className="mt-auto pt-6 border-t border-slate-50 flex items-end justify-between">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço Consumidor</p>
                   <p className="text-3xl font-black text-blue-600 tracking-tighter">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                {product.costPrice && product.costPrice > 0 && (
                  <div className="text-right">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Margem</p>
                    <p className="text-sm font-black text-slate-400">{(((product.price - product.costPrice) / product.price) * 100).toFixed(0)}%</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-40 text-center bg-white rounded-[50px] border-2 border-dashed border-slate-50 flex flex-col items-center">
             <Package className="h-16 w-16 text-slate-100 mb-6" />
             <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Catálogo vazio ou sem correspondências.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[50px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-950 p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{editingProduct ? 'Ajustar Produto' : 'Novo Produto Elite'}</h3>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Configuração de Catálogo</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-white"><Plus className="h-6 w-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">Descrição Comercial do Produto</label>
                  <input required type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-indigo-950" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">Preço de Venda (R$)</label>
                  <input required type="number" step="0.01" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-black text-indigo-950" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">Custo de Produção (Interno)</label>
                  <input type="number" step="0.01" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-black text-indigo-950" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">Unidade</label>
                  <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-indigo-950" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="ex: unid, kg, m" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">Categoria de Grupo</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-black text-[10px] uppercase tracking-widest text-indigo-950" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: parseInt(e.target.value)})}>
                    <option value="">Nenhuma Categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-950 transition-colors">Cancelar</button>
                <button type="submit" className="bg-indigo-950 text-white px-10 py-4 rounded-[20px] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95">Consolidar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
