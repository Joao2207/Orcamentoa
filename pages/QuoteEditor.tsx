
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Quote, Customer, Product, QuoteItem, QuoteStatus, CompanySettings } from '../types';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Search, 
  Save, 
  PackageSearch, 
  CheckCircle2, 
  MessageCircle, 
  FileText, 
  Calendar,
  AlertCircle,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [quoteData, setQuoteData] = useState<Partial<Quote>>({
    customerId: 0,
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    validity: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deliveryDate: '',
    items: [],
    discount: 0,
    shippingFee: 0,
    total: 0,
    observations: settings?.defaultObservations || '',
    status: QuoteStatus.PENDING
  });

  useEffect(() => {
    const loadData = async () => {
      const [cList, pList] = await Promise.all([
        db.customers.toArray(),
        db.products.toArray()
      ]);
      setCustomers(cList);
      // Filtra produtos ativos (aceita boolean ou 1/0)
      setProducts(pList.filter(p => p.active === true || (p as any).active === 1));
    };
    loadData();
    if (initialQuote) setQuoteData(initialQuote);
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
    setErrors(prev => ({ ...prev, items: '' }));
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

  const handleFinalSave = async (mode: 'save' | 'pdf' | 'whatsapp' = 'save') => {
    if (!quoteData.customerId) {
        setErrors(prev => ({...prev, customer: 'Selecione um cliente'}));
        return;
    }

    const finalData = quoteData as Quote;
    let quoteId = finalData.id;
    if (quoteId) {
      const { id, ...updates } = finalData;
      await db.quotes.update(quoteId, updates);
    } else {
      quoteId = await db.quotes.add(finalData);
    }

    if (mode === 'whatsapp' && settings) {
      const customer = customers.find(c => c.id === finalData.customerId);
      if (customer) {
        const cleanPhone = customer.phone.replace(/\D/g, '');
        const message = `Olá ${customer.name}! Seu orçamento #${quoteId} de R$ ${finalData.total.toLocaleString('pt-BR')} está pronto.`;
        window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }
    } else if (mode === 'pdf' && settings) {
        const customer = customers.find(c => c.id === finalData.customerId);
        if (customer) {
            const doc = generateQuotePDF({...finalData, id: quoteId}, settings, customer);
            doc.save(`Orcamento_${quoteId}.pdf`);
        }
    }
    onBack();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
      {/* HEADER DE AÇÃO RÁPIDA */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 sticky top-0 z-40 bg-slate-50/90 backdrop-blur-xl py-6 px-2 border-b border-slate-200">
        <button onClick={onBack} className="flex items-center text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-950 transition-all active:scale-95">
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar Edição
        </button>
        <div className="flex gap-4">
           <button onClick={() => setShowConfirmModal(true)} className="bg-indigo-950 text-white px-12 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3">
              <Save className="h-5 w-5" /> REVISAR E SALVAR
           </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-10">
        {/* SEÇÃO 1: CABEÇALHO DO ORÇAMENTO */}
        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
             </div>
             <h3 className="text-xl font-black text-indigo-950 tracking-tighter uppercase">Identificação</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Destinatário (Cliente)</label>
              <select 
                className={`w-full px-8 py-5 bg-slate-50 border rounded-3xl font-bold text-indigo-950 outline-none transition-all ${errors.customer ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-100 focus:ring-4 focus:ring-blue-100'}`}
                value={quoteData.customerId} 
                onChange={e => {
                  const id = parseInt(e.target.value);
                  const name = customers.find(c => c.id === id)?.name || '';
                  setQuoteData({...quoteData, customerId: id, customerName: name});
                  setErrors(prev => ({...prev, customer: ''}));
                }}
              >
                <option value="0">Selecione o cliente...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 ml-1">Previsão de Entrega 🚚</label>
              <input 
                type="date" 
                className="w-full px-8 py-5 bg-blue-50/50 border border-blue-100 rounded-3xl font-black text-blue-700 outline-none focus:ring-4 focus:ring-blue-200 transition-all"
                value={quoteData.deliveryDate} 
                onChange={e => setQuoteData({...quoteData, deliveryDate: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: CATÁLOGO DE PRODUTOS (SELEÇÃO) */}
        <div className="bg-indigo-950 p-10 rounded-[48px] shadow-2xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
              <div className="flex items-center gap-3">
                <PackageSearch className="h-8 w-8 text-blue-400" />
                <h3 className="text-2xl font-black tracking-tighter uppercase">Escolher Produtos</h3>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300" />
                <input 
                  type="text" 
                  placeholder="Buscar no catálogo..." 
                  className="w-full pl-12 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:bg-white/20 transition-all placeholder:text-white/30"
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).map(p => (
                <button 
                  key={p.id} 
                  onClick={() => addItem(p)}
                  className="group flex items-center justify-between p-6 bg-white/5 hover:bg-white/15 rounded-3xl border border-white/5 transition-all active:scale-95 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black truncate group-hover:text-blue-300 transition-colors uppercase">{p.name}</p>
                    <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-widest">R$ {p.price.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0 ml-4">
                    <Plus className="h-5 w-5" />
                  </div>
                </button>
              ))}
              {products.length === 0 && (
                <div className="col-span-full py-10 text-center opacity-40 italic">Nenhum produto cadastrado no catálogo.</div>
              )}
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: REVISÃO DE ITENS SELECIONADOS (TABELA) */}
        <div className="bg-white rounded-[48px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <ShoppingCart className="h-6 w-6 text-blue-600" />
               <h3 className="text-xl font-black text-indigo-950 tracking-tighter uppercase">Itens da Proposta</h3>
            </div>
            {quoteData.items?.length! > 0 && (
                <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                    {quoteData.items?.length} Itens Selecionados
                </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-10 py-6 text-left">Especificação</th>
                  <th className="px-6 py-6 text-center">Quantidade</th>
                  <th className="px-6 py-6 text-right">Preço Unit.</th>
                  <th className="px-10 py-6 text-right">Subtotal</th>
                  <th className="px-6 py-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {quoteData.items?.map((item, index) => (
                  <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-8">
                      <p className="text-sm font-black text-indigo-950 uppercase">{item.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: Item {index + 1}</p>
                    </td>
                    <td className="px-6 py-8 w-40">
                      <div className="flex items-center bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
                        <button 
                            onClick={() => updateItem(index, { quantity: Math.max(1, (item.quantity || 1) - 1) })}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-950 transition-colors font-black"
                        >-</button>
                        <input 
                            type="number" 
                            className="w-full text-center bg-transparent outline-none font-black text-sm text-indigo-950" 
                            value={item.quantity} 
                            onChange={e => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })} 
                        />
                        <button 
                            onClick={() => updateItem(index, { quantity: (item.quantity || 0) + 1 })}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-950 transition-colors font-black"
                        >+</button>
                      </div>
                    </td>
                    <td className="px-6 py-8 text-right">
                      <input 
                        type="number" 
                        step="0.01" 
                        className="w-32 text-right bg-slate-50 border border-transparent focus:border-blue-200 rounded-xl py-3 px-4 font-black text-sm text-indigo-950 outline-none transition-all" 
                        value={item.unitPrice} 
                        onChange={e => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })} 
                      />
                    </td>
                    <td className="px-10 py-8 text-right">
                       <span className="text-sm font-black text-blue-600">R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-8 text-center">
                      <button onClick={() => removeItem(index)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!quoteData.items || quoteData.items.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center">
                       <div className="flex flex-col items-center opacity-20">
                          <PackageSearch className="h-16 w-16 mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Escolha itens no catálogo azul acima</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SEÇÃO 4: OBSERVAÇÕES E FECHAMENTO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                 <FileText className="h-5 w-5 text-blue-600" />
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações da Proposta</h4>
              </div>
              <textarea 
                className="flex-1 w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[30px] text-sm font-bold text-indigo-950 outline-none focus:ring-4 focus:ring-blue-100 min-h-[180px] transition-all"
                value={quoteData.observations}
                onChange={e => setQuoteData({...quoteData, observations: e.target.value})}
                placeholder="Ex: Condições de pagamento, prazos de validade, detalhes personalizados..."
              />
            </div>

            <div className="bg-indigo-950 p-10 rounded-[48px] shadow-2xl text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-500"></div>
              
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Subtotal Bruto</span>
                  <span className="font-black text-sm">R$ {(quoteData.total! + quoteData.discount! - quoteData.shippingFee!).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Desconto Especial</span>
                    <p className="text-[8px] font-bold text-white/30 uppercase mt-1">Ajuste manual do valor</p>
                  </div>
                  <div className="flex items-center bg-white/5 rounded-2xl px-4 py-2 border border-white/5">
                    <span className="text-red-400 font-black mr-2">-</span>
                    <input 
                        type="number" 
                        className="bg-transparent border-none outline-none w-24 text-right font-black text-white" 
                        value={quoteData.discount} 
                        onChange={e => calculateTotals(quoteData.items || [], parseFloat(e.target.value) || 0, quoteData.shippingFee || 0)} 
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Taxa de Logística / Frete</span>
                  <div className="flex items-center bg-white/5 rounded-2xl px-4 py-2 border border-white/5">
                    <span className="text-blue-400 font-black mr-2">+</span>
                    <input 
                        type="number" 
                        className="bg-transparent border-none outline-none w-24 text-right font-black text-white" 
                        value={quoteData.shippingFee} 
                        onChange={e => calculateTotals(quoteData.items || [], quoteData.discount || 0, parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                </div>

                <div className="pt-10 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1">Total Consolidado</span>
                    <h2 className="text-5xl font-black tracking-tighter">R$ {quoteData.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                  </div>
                  <TrendingUp className="h-10 w-10 text-blue-500 opacity-20" />
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE SALVAMENTO */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-indigo-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[60px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="bg-indigo-950 p-12 text-white relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full -mr-16 -mt-16"></div>
               <h3 className="text-4xl font-black uppercase tracking-tighter leading-none mb-4">Finalizar Orçamento?</h3>
               <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Revisão final de proposta</p>
            </div>

            <div className="p-12 space-y-10">
               <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cliente Selecionado</p>
                     <p className="text-2xl font-black text-indigo-950">{quoteData.customerName || 'Nenhum Cliente'}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total da Proposta</p>
                     <p className="text-3xl font-black text-blue-600">R$ {quoteData.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => handleFinalSave('save')} 
                    className="w-full py-6 bg-indigo-950 text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Save className="h-5 w-5" /> SALVAR REGISTRO
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleFinalSave('pdf')} className="py-5 bg-slate-100 text-indigo-950 font-black uppercase text-[10px] tracking-widest rounded-3xl active:scale-95 flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                       <FileText className="h-5 w-5" /> BAIXAR PDF
                    </button>
                    <button onClick={() => handleFinalSave('whatsapp')} disabled={isSharing} className="py-5 bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-3xl active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all">
                       <MessageCircle className="h-5 w-5" /> WHATSAPP
                    </button>
                  </div>
               </div>
               
               <button onClick={() => setShowConfirmModal(false)} className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-red-500 transition-colors">Voltar e Ajustar Itens</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteEditor;
