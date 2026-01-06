
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Customer, Quote } from '../types';
import { Search, Plus, Edit2, Trash2, History, AlertTriangle, MapPin, Map } from 'lucide-react';
import { format } from 'date-fns';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<{customer: Customer, quotes: Quote[]} | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
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
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Clientes</h2>
          <p className="text-gray-500">Gerencie contatos e endereços de entrega.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="mr-2 h-5 w-5" />
          Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar pelo nome ou telefone..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl uppercase">
                {customer.name.charAt(0)}
              </div>
              <div className="flex space-x-1">
                {customer.address?.street && (
                  <button onClick={() => openMap(customer.address)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Ver no Mapa">
                    <Map className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => handleEdit(customer)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => confirmDelete(customer)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <h3 className="font-bold text-lg text-gray-900 truncate">{customer.name}</h3>
            <p className="text-gray-500 text-sm">{customer.phone}</p>
            {customer.address?.street && (
              <div className="mt-3 flex items-start text-xs text-gray-400">
                <MapPin className="h-3 w-3 mr-1 mt-0.5 shrink-0" />
                <span className="truncate">{customer.address.street}, {customer.address.number} - {customer.address.city}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-indigo-600 p-6 text-white shrink-0">
              <h3 className="text-xl font-black uppercase">{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Nome Completo *</label>
                  <input required className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Telefone *</label>
                  <input required className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">E-mail</label>
                  <input type="email" className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-black text-gray-700 uppercase flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-indigo-600" /> Endereço de Entrega
                  </h4>
                  {formData.address.street && (
                    <button 
                      type="button" 
                      onClick={() => openMap(formData.address)}
                      className="text-[10px] font-black uppercase text-green-600 flex items-center hover:underline"
                    >
                      <Map className="h-3 w-3 mr-1" /> Ver no mapa
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-9">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Rua / Logradouro</label>
                    <input className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none" value={formData.address.street} onChange={e => setFormData({...formData, address: {...formData.address, street: e.target.value}})} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nº</label>
                    <input className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none" value={formData.address.number} onChange={e => setFormData({...formData, address: {...formData.address, number: e.target.value}})} />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Bairro</label>
                    <input className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none" value={formData.address.neighborhood} onChange={e => setFormData({...formData, address: {...formData.address, neighborhood: e.target.value}})} />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Cidade</label>
                    <input className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none" value={formData.address.city} onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value}})} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-500 font-black uppercase text-xs">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg">Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {customerToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="h-8 w-8" /></div>
            <h3 className="text-xl font-black mb-2">Excluir Cliente?</h3>
            <p className="text-gray-500 text-sm mb-6">Esta ação é permanente.</p>
            <div className="flex gap-2">
              <button onClick={() => setCustomerToDelete(null)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Voltar</button>
              <button onClick={executeDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
