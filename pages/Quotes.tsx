
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Quote, QuoteStatus, CompanySettings, Customer } from '../types';
import { Search, Plus, Eye, Trash2, Download, MessageCircle, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { generateQuotePDF } from '../utils/pdfGenerator';

interface QuotesProps {
  onEdit: (quote: Quote) => void;
  onNew: () => void;
  settings: CompanySettings | null;
  onStatusChanged?: () => void; // Adicionado para refresh global
}

const Quotes: React.FC<QuotesProps> = ({ onEdit, onNew, settings, onStatusChanged }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSharing, setIsSharing] = useState<number | null>(null);

  const loadData = async () => {
    const list = await db.quotes.reverse().toArray();
    setQuotes(list);
    const custArr = await db.customers.toArray();
    const custMap: Record<number, Customer> = {};
    custArr.forEach(c => { if(c.id) custMap[c.id] = c; });
    setCustomers(custMap);
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento permanentemente?')) {
      await db.quotes.delete(id);
      await loadData();
      if (onStatusChanged) onStatusChanged();
    }
  };

  const handleStatusChange = async (quote: Quote, newStatus: QuoteStatus) => {
    await db.quotes.update(quote.id!, { status: newStatus });
    await loadData(); // Atualiza localmente
    if (onStatusChanged) onStatusChanged(); // Notifica o App para atualizar estatísticas
  };

  const handleDownloadPDF = async (quote: Quote) => {
    if (!settings) return alert("Configure sua empresa primeiro.");
    const customer = customers[quote.customerId] || { name: quote.customerName } as Customer;
    const doc = generateQuotePDF(quote, settings, customer);
    doc.save(`Orcamento_${quote.id}_${customer.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleShareWhatsApp = async (quote: Quote) => {
    const customer = customers[quote.customerId];
    if (!customer) return;
    if (!settings) return alert("Configure sua empresa primeiro.");

    setIsSharing(quote.id!);

    try {
      const doc = generateQuotePDF(quote, settings, customer);
      const pdfBlob = doc.output('blob');
      const fileName = `Orcamento_${quote.id}_${customer.name.replace(/\s+/g, '_')}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Orçamento #${quote.id} - ${settings.companyName}`,
          text: `Olá ${customer.name}, segue o orçamento solicitado.`
        });
      } else {
        const cleanPhone = customer.phone.replace(/\D/g, '');
        const message = `Olá ${customer.name}! Segue o resumo do seu orçamento #${quote.id}:\n\nTotal: R$ ${quote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nEstou enviando o PDF em anexo para sua conferência.`;
        const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    } finally {
      setIsSharing(null);
    }
  };

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || q.id?.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.APPROVED: return 'bg-emerald-100 text-green-700 border-green-200';
      case QuoteStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      case QuoteStatus.PRODUCTION: return 'bg-blue-100 text-blue-700 border-blue-200';
      case QuoteStatus.DELIVERED: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case QuoteStatus.NEGOTIATING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-indigo-950 tracking-tighter uppercase leading-none mb-1">Orçamentos</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] italic">Gestão de propostas comerciais.</p>
        </div>
        <button onClick={onNew} className="bg-indigo-950 text-white px-10 py-5 rounded-3xl font-black flex items-center justify-center hover:bg-blue-600 transition-all shadow-2xl active:scale-95 text-xs tracking-widest">
          <Plus className="mr-3 h-6 w-6" /> NOVO ORÇAMENTO
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
          <input type="text" placeholder="Filtrar por cliente..." className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[30px] shadow-sm outline-none focus:ring-8 focus:ring-blue-100/50 font-bold transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="bg-white px-8 py-5 border border-slate-100 rounded-[30px] shadow-sm outline-none font-black text-[10px] uppercase tracking-widest text-indigo-950 focus:ring-8 focus:ring-blue-100/50" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos os Status</option>
          {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredQuotes.map((quote) => (
          <div key={quote.id} className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 hover:shadow-2xl hover:border-blue-50 transition-all group">
            <div className="flex items-center gap-8 w-full lg:w-auto">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-indigo-950 font-black text-lg group-hover:bg-indigo-950 group-hover:text-white transition-all shadow-sm">#{quote.id}</div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-black text-indigo-950 leading-tight truncate tracking-tighter">{quote.customerName}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">{format(parseISO(quote.date), 'dd/MM/yyyy')} • Validade: {format(parseISO(quote.validity), 'dd/MM/yyyy')}</p>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end w-full lg:w-auto">
              <p className="text-3xl font-black text-blue-600 tracking-tighter">R$ {quote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              
              <select 
                value={quote.status}
                onChange={(e) => handleStatusChange(quote, e.target.value as QuoteStatus)}
                className={`mt-4 text-[10px] px-6 py-2.5 rounded-full font-black uppercase tracking-widest border outline-none cursor-pointer transition-all ${getStatusColor(quote.status)} shadow-sm hover:scale-105 active:scale-95`}
              >
                {Object.values(QuoteStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-6 lg:pt-0">
              <button onClick={() => onEdit(quote)} className="p-4 text-indigo-600 hover:bg-indigo-50 rounded-3xl transition-all active:scale-90" title="Editar"><Eye className="h-6 w-6" /></button>
              <button onClick={() => handleDownloadPDF(quote)} className="p-4 text-blue-600 hover:bg-blue-50 rounded-3xl transition-all active:scale-90" title="Gerar PDF"><Download className="h-6 w-6" /></button>
              <button 
                onClick={() => handleShareWhatsApp(quote)} 
                disabled={isSharing === quote.id}
                className={`p-4 text-emerald-500 hover:bg-emerald-50 rounded-3xl transition-all active:scale-90 ${isSharing === quote.id ? 'animate-pulse' : ''}`} 
                title="WhatsApp"
              >
                <MessageCircle className="h-6 w-6" />
              </button>
              <button onClick={() => handleDelete(quote.id!)} className="p-4 text-red-400 hover:bg-red-50 rounded-3xl transition-all active:scale-90" title="Excluir"><Trash2 className="h-6 w-6" /></button>
            </div>
          </div>
        ))}
        {filteredQuotes.length === 0 && (
          <div className="py-32 text-center bg-white rounded-[60px] border-4 border-dashed border-slate-50 flex flex-col items-center">
             <FileText className="h-20 w-20 text-slate-100 mb-8" />
             <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-[11px]">Nenhum orçamento encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quotes;
