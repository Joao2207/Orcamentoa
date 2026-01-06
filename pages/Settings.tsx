
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { CompanySettings, ProductMode, PDFTheme, Category } from '../types';
import { Save, Shield, Download, Upload, Trash2, Camera, Palette, Lock, Tag, Plus, CheckCircle2, Truck } from 'lucide-react';

interface SettingsProps {
  settings: CompanySettings | null;
  onUpdate: (newSettings: CompanySettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState<CompanySettings>(settings || {
    companyName: '',
    ownerName: '',
    phone: '',
    email: '',
    defaultObservations: '',
    productMode: ProductMode.SIMPLE,
    pdfTheme: PDFTheme.SIMPLE,
    password: '',
    pin: '',
    shippingRatePerKm: 5
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [message, setMessage] = useState('');

  const loadCategories = async () => {
    setCategories(await db.categories.toArray());
  };

  useEffect(() => { 
    loadCategories(); 
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings?.id) {
      await db.settings.update(settings.id, formData);
    } else {
      await db.settings.add(formData);
    }
    onUpdate(formData);
    setMessage('Configurações salvas!');
    setTimeout(() => setMessage(''), 3000);
  };

  const addCategory = async () => {
    if (newCatName.trim()) {
      await db.categories.add({ name: newCatName.trim() });
      setNewCatName('');
      loadCategories();
    }
  };

  const deleteCategory = async (id: number) => {
    if (confirm('Excluir esta categoria?')) {
      await db.categories.delete(id);
      loadCategories();
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Configurações</h2>
          <p className="text-gray-500 font-medium italic">Personalize o app para o seu jeito.</p>
        </div>
        {message && (
          <div className="bg-green-500 text-white px-6 py-2 rounded-full text-xs font-black uppercase flex items-center shadow-lg animate-bounce">
            <CheckCircle2 className="mr-2 h-4 w-4" /> {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black mb-6 flex items-center">
              <Camera className="mr-2 h-6 w-6 text-indigo-600" /> Perfil Profissional
            </h3>
            <div className="flex flex-col items-center mb-6">
               <div className="w-32 h-32 bg-gray-50 rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden relative group">
                  {formData.logoBase64 ? (
                    <img src={formData.logoBase64} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Camera className="h-8 w-8 text-gray-300" />
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <span className="text-white text-[10px] font-black uppercase">Trocar</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </label>
               </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Empresa</label>
                <input className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none font-bold" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Proprietária</label>
                <input className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none font-bold" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black mb-6 flex items-center">
              <Truck className="mr-2 h-6 w-6 text-indigo-600" /> Logística e Frete
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Taxa de Entrega por KM (R$)</label>
                <input type="number" step="0.50" className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none font-bold" value={formData.shippingRatePerKm} onChange={e => setFormData({...formData, shippingRatePerKm: parseFloat(e.target.value)})} />
                <p className="text-[10px] text-gray-400 mt-1 uppercase">Usado para sugerir o valor do frete no editor de orçamentos.</p>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">
            <Save className="mr-2 h-5 w-5 inline" /> Salvar Configurações
          </button>
        </form>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black mb-6 flex items-center">
              <Tag className="mr-2 h-6 w-6 text-indigo-600" /> Categorias
            </h3>
            <div className="flex gap-2 mb-6">
              <input className="flex-1 px-4 py-3 bg-gray-50 border rounded-2xl outline-none font-bold" placeholder="Nova..." value={newCatName} onChange={e => setNewCatName(e.target.value)} />
              <button onClick={addCategory} className="bg-indigo-600 text-white p-3 rounded-2xl"><Plus className="h-6 w-6" /></button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-700 text-sm">{cat.name}</span>
                  <button onClick={() => deleteCategory(cat.id!)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 p-8 rounded-3xl shadow-xl text-white">
            <h3 className="text-xl font-black mb-4 flex items-center">
              <Shield className="mr-2 h-6 w-6" /> Offline & Backup
            </h3>
            <p className="text-indigo-200 text-xs font-medium mb-6">Este app funciona sem internet. Seus dados são locais.</p>
            <div className="grid grid-cols-2 gap-4">
               <button className="flex flex-col items-center p-4 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                  <Download className="h-5 w-5 mb-2" />
                  <span className="text-[10px] font-black uppercase">Exportar</span>
               </button>
               <button className="flex flex-col items-center p-4 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                  <Upload className="h-5 w-5 mb-2" />
                  <span className="text-[10px] font-black uppercase">Importar</span>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
