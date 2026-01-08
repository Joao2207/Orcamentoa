
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Customer, Quote } from '../types';
import { Search, Plus, Edit2, Trash2, MapPin, Map, AlertTriangle } from 'lucide-react';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    observations: string;
    address: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode?: string;
    }
  }>({
    name: '',
    phone: '',
    email: '',
    observations: '',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: 'SP',
      zipCode: ''
    }
  });

  const loadCustomers = async () => {
    const list = await db.customers.toArray();
    setCustomers(list);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer?.id) {
      await db.customers.update(editingCustomer.id, formData);
    } else {
      await db.customers.add(formData);
    }
    resetForm();
    setIsModalOpen(false);
    loadCustomers();
  };

  const resetForm = () => {
    setFormData({ 
      name: '', phone: '', email: '', observations: '', 
      address: { street: '', number: '', neighborhood: '', city: '', state: 'SP', zipCode: '' } 
    });
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      observations: customer.observations || '',
      address: customer.address || { street: '', number: '', neighborhood: '', city: '', state: 'SP', zipCode: '' }
    });
    setIsModalOpen(true);
  };

  const confirmDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const executeDelete = async () => {
    if (customerToDelete?.id) {
      await db.customers.delete(customerToDelete.id);
      setCustomerToDelete(null);
      loadCustomers();
    }
  };

  const openMap = (address: any) => {
    const query = encodeURIComponent(`${address.street}, ${address.number}, ${address.neighborhood}, ${address.city} - ${address.state}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase leading-none mb-2">Clientes</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest opacity-70">Gerencie sua rede de contatos exclusiva.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-indigo-950 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center hover:bg-blue-600 transition-all shadow-xl active:scale-95 text-xs tracking-widest"
        >
          <Plus className="mr-2 h-5 w-5" />
          NOVO CLIENTE
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
        <input
          type="text"
          placeholder="Buscar pelo nome ou telefone..."
          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold placeholder:text-slate-300 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCustomers.map((customer, index) => (
          <div 
            key={customer.id} 
            className="animate-card-entry bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:border-blue-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group flex flex-col"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-lg transform group-hover:rotate-6 transition-transform">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex gap-1">
                {customer.address?.street && (
                  <button onClick={() => openMap(customer.address)} className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all" title="Ver no Mapa">
                    <Map className="h-5 w-5" />
                  </button>
                )}
                <button onClick={() => handleEdit(customer)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"><Edit2 className="h-5 w-5" /></button>
                <button onClick={() => confirmDelete(customer)} className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="h-5 w-5" /></button>
              </div>
            </div>
            
            <h3 className="font-black text-xl text-indigo-950 truncate mb-1">{customer.name}</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">{customer.phone}</p>
            
            {customer.address?.street && (
              <div className="mt-auto pt-6 border-t border-slate-50 flex items-start text-xs text-slate-400">
                <MapPin className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                <span className="truncate leading-relaxed">{customer.address.street}, {customer.address.number}<br/>{customer.address.city}</span>
              </div>
            )}
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
             <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 rounded-full mb-6">
                <Search className="h-10 w-10 text-slate-200" />
             </div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[50px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-indigo-950 p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{editingCustomer ? 'Refinar Perfil' : 'Novo Cliente Elite'}</h3>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Cadastro de Portfólio</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-white"><Plus className="h-6 w-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">Nome Completo Premium</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-indigo-950" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">Telefone / WhatsApp</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-indigo-950" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">E-mail Corporativo</label>
                  <input type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-indigo-950" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-black text-indigo-950 uppercase tracking-widest flex items-center">
                    <MapPin className="mr-3 h-5 w-5 text-blue-600" /> Endereço de Entrega
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-9">
                    <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">Rua / Logradouro</label>
                    <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-indigo-950" value={formData.address.street} onChange={e => setFormData({...formData, address: {...formData.address, street: e.target.value}})} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">Nº</label>
                    <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-indigo-950" value={formData.address.number} onChange={e => setFormData({...formData, address: {...formData.address, number: e.target.value}})} />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">Bairro</label>
                    <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-indigo-950" value={formData.address.neighborhood} onChange={e => setFormData({...formData, address: {...formData.address, neighborhood: e.target.value}})} />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 ml-1">Cidade</label>
                    <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-indigo-950" value={formData.address.city} onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value}})} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-950 transition-colors">Cancelar</button>
                <button type="submit" className="bg-indigo-950 text-white px-10 py-4 rounded-[20px] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95">Salvar Cadastro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {customerToDelete && (
        <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
               <AlertTriangle className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-indigo-950 tracking-tighter mb-2 leading-none">Excluir Perfil?</h3>
            <p className="text-slate-400 font-medium text-sm mb-8 leading-relaxed">Esta ação é permanente e removerá o cliente de sua rede.</p>
            <div className="flex gap-3">
              <button onClick={() => setCustomerToDelete(null)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">Voltar</button>
              <button onClick={executeDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100 hover:bg-red-600 transition-all">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
