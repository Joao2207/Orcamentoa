
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Quote, Customer, Product, QuoteItem, QuoteStatus, CompanySettings } from '../types';
import { Plus, Trash2, ArrowLeft, Search, Save, PackageSearch, Truck, Map } from 'lucide-react';
import { generateQuotePDF } from '../utils/pdfGenerator';

interface QuoteEditorProps {
  initialQuote?: Quote | null;
  onBack: () => void;
  settings: CompanySettings | null;
}

const QuoteEditor: React.FC<QuoteEditorProps> = ({ initialQuote, onBack, settings }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [showProductPanel, setShowProductPanel] = useState(true);
  
  const [quoteData, setQuoteData] = useState<Partial<Quote>>({
    customerId: 0,
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    validity: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    discount: 0,
    shippingFee: 0,
    shippingDistance: 0,
    total: 0,
    observations: settings?.defaultObservations || '',
    status: QuoteStatus.PENDING
  });

  useEffect(() => {
    const loadData = async () => {
      setCustomers(await db.customers.toArray());
      const allProducts = await db.products.toArray();
      setProducts(allProducts.filter(p => p.active === true || (p as any).active === 1));
    };
    loadData();

    if (initialQuote) {
      setQuoteData(initialQuote);
    }
  }, [initialQuote, settings]);

  const calculateTotals = (items: QuoteItem[], discount: number, shippingFee: number) => {
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const total = Math.max(0, subtotal - discount + shippingFee);
    setQuoteData(prev => ({ ...prev, items, discount, shippingFee, total }));
  };

  const addItem = (product: Product) => {
    const newItem: QuoteItem = {
      productId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: product.price,
      subtotal: product.price,
      unit: product.unit || 'unid'
    };
    const updatedItems = [...(quoteData.items || []), newItem];
    calculateTotals(updatedItems, quoteData.discount || 0, quoteData.shippingFee || 0);
  };

  const removeItem = (index: number) => {
    const updatedItems = [...(quoteData.items || [])];
    updatedItems.splice(index, 1);
    calculateTotals(updatedItems, quoteData.discount || 0, quoteData.shippingFee || 0);
  };

  const updateItem = (index: number, fields: Partial<QuoteItem>) => {
    const updatedItems = [...(quoteData.items || [])];
    const item = { ...updatedItems[index], ...fields };
    item.subtotal = (item.quantity || 0) * (item.unitPrice || 0);
    updatedItems[index] = item;
    calculateTotals(updatedItems, quoteData.discount || 0, quoteData.shippingFee || 0);
  };

  const openMap = () => {
    const customer = customers.find(c => c.id === quoteData.customerId);
    if (customer?.address?.street) {
      const addr = customer.address;
      const query = encodeURIComponent(`${addr.street}, ${addr.number}, ${addr.neighborhood}, ${addr.city} - ${addr.state}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const handleSave = async (mode: 'save' | 'pdf' = 'save') => {
    if (!quoteData.customerId || (quoteData.items?.length === 0)) {
      alert('Selecione um cliente e adicione pelo menos um produto.');
      return;
    }
    const finalData = quoteData as Quote;
    let quoteId = finalData.id;
    if (quoteId) await db.quotes.update(quoteId, finalData);
    else quoteId = await db.quotes.add(finalData);

    const customer = customers.find(c => c.id === finalData.customerId);
    if (mode === 'pdf' && settings && customer) {
      const doc = generateQuotePDF({ ...finalData, id: quoteId }, settings, customer);
      doc.save(`Orcamento_${quoteId}.pdf`);
    }
    onBack();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center text-gray-400 hover:text-indigo-600 font-black uppercase text-xs">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </button>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowProductPanel(!showProductPanel)} className={`px-4 py-2 rounded-xl font-bold text-xs uppercase border transition-all ${showProductPanel ? 'bg-white text-indigo-600 border-indigo-200' : 'bg-indigo-600 text-white'}`}>
            <PackageSearch className="mr-2 h-4 w-4 inline" /> Catálogo
          </button>
          <button onClick={() => handleSave('save')} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase shadow-lg shadow-green-100 flex items-center">
            <Save className="mr-2 h-4 w-4" /> Salvar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`${showProductPanel ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-sm font-black text-gray-700 uppercase">Cliente e Status</h3>
              <select 
                className="text-[10px] font-black uppercase tracking-widest border rounded-lg px-2 py-1 bg-gray-50 outline-none"
                value={quoteData.status}
                onChange={e => setQuoteData({...quoteData, status: e.target.value as QuoteStatus})}
              >
                {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Cliente Selecionado</label>
                <select className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none font-bold" value={quoteData.customerId} onChange={e => {
                  const id = parseInt(e.target.value);
                  const name = customers.find(c => c.id === id)?.name || '';
                  setQuoteData({...quoteData, customerId: id, customerName: name});
                }}>
                  <option value="0">Escolha um cliente...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Data do Orçamento</label>
                <input type="date" className="w-full px-4 py-3 bg-gray-50 border rounded-2xl text-xs font-bold" value={quoteData.date} onChange={e => setQuoteData({...quoteData, date: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Validade</label>
                <input type="date" className="w-full px-4 py-3 bg-gray-50 border rounded-2xl text-xs font-bold" value={quoteData.validity} onChange={e => setQuoteData({...quoteData, validity: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b flex justify-between items-center"><h3 className="text-sm font-black text-gray-700 uppercase">Itens do Orçamento</h3></div>
             <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                    <tr>
                      <th className="px-6 py-4 text-left">Produto</th>
                      <th className="px-6 py-4 text-center">Qtd</th>
                      <th className="px-6 py-4 text-right">Unitário</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {quoteData.items?.map((item, index) => (
                      <tr key={index} className="text-sm font-bold text-gray-700">
                        <td className="px-6 py-4">{item.name}</td>
                        <td className="px-6 py-4 w-24"><input type="number" className="w-full text-center bg-gray-50 rounded-lg py-1 border" value={item.quantity} onChange={e => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })} /></td>
                        <td className="px-6 py-4 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-indigo-600">R$ {item.subtotal.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center"><button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                    {quoteData.items?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-medium italic">Adicione produtos do catálogo ao lado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-gray-700 uppercase flex items-center">
                <Truck className="mr-2 h-4 w-4 text-indigo-600" /> Entrega e Observações
              </h3>
              <div className="p-3 bg-gray-50 rounded-2xl border relative group">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Destino do Cliente</p>
                <p className="text-xs font-bold text-gray-700 truncate pr-8">
                  {customers.find(c => c.id === quoteData.customerId)?.address?.street 
                    ? `${customers.find(c => c.id === quoteData.customerId)?.address?.street}, ${customers.find(c => c.id === quoteData.customerId)?.address?.number}`
                    : "Endereço não cadastrado"}
                </p>
                {customers.find(c => c.id === quoteData.customerId)?.address?.street && (
                  <button onClick={openMap} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg text-green-600 shadow-sm border"><Map className="h-4 w-4" /></button>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Observações Gerais</label>
                <textarea 
                  className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none text-xs h-24 resize-none" 
                  value={quoteData.observations} 
                  onChange={e => setQuoteData({...quoteData, observations: e.target.value})}
                  placeholder="Formas de pagamento, prazo de entrega..."
                />
              </div>
            </div>

            <div className="bg-indigo-900 p-8 rounded-3xl shadow-xl text-white space-y-4">
              <div className="flex justify-between text-xs font-black text-indigo-300 uppercase">
                <span>Subtotal dos Itens</span>
                <span>R$ {((quoteData.items || []).reduce((acc, i) => acc + i.subtotal, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black text-indigo-300 uppercase">
                <span className="flex items-center"><Truck className="mr-1 h-3 w-3" /> Valor do Frete</span>
                <input type="number" step="0.01" className="w-24 bg-white/10 text-right py-1.5 px-3 rounded-lg border border-white/20 outline-none focus:ring-1 focus:ring-indigo-400" value={quoteData.shippingFee} onChange={e => calculateTotals(quoteData.items || [], quoteData.discount || 0, parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between items-center text-xs font-black text-red-300 uppercase">
                <span>Desconto Total</span>
                <input type="number" step="0.01" className="w-24 bg-white/10 text-right py-1.5 px-3 rounded-lg border border-white/20 outline-none focus:ring-1 focus:ring-red-400" value={quoteData.discount} onChange={e => calculateTotals(quoteData.items || [], parseFloat(e.target.value) || 0, quoteData.shippingFee || 0)} />
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <span className="text-xs font-black uppercase">Total do Orçamento</span>
                <span className="text-3xl font-black">R$ {(quoteData.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {showProductPanel && (
          <div className="lg:col-span-4 h-fit sticky top-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col max-h-[calc(100vh-10rem)]">
              <h3 className="text-sm font-black text-gray-700 uppercase mb-4">Catálogo de Produtos</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Buscar no catálogo..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border rounded-xl text-xs outline-none" value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).map(p => (
                  <button key={p.id} onClick={() => addItem(p)} className="w-full p-3 border rounded-2xl hover:bg-indigo-50 transition-all text-left flex justify-between items-center group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">{p.name}</p>
                      <p className="text-[10px] font-bold text-indigo-600">R$ {p.price.toFixed(2)}</p>
                    </div>
                    <Plus className="h-4 w-4 text-indigo-300 group-hover:text-indigo-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteEditor;
