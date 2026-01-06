
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Quote, QuoteStatus, CompanySettings, Customer, Order } from '../types';
import { Search, Plus, Eye, Trash2, Download, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { generateQuotePDF } from '../utils/pdfGenerator';

interface QuotesProps {
  onEdit: (quote: Quote) => void;
  onNew: () => void;
  settings: CompanySettings | null;
}

const Quotes: React.FC<QuotesProps> = ({ onEdit, onNew, settings }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loadingPdf, setLoadingPdf] = useState<number | null>(null);

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
    if (confirm('Excluir este orçamento?')) {
      await db.quotes.delete(id);
      loadData();
    }
  };

  const handleStatusChange = async (id: number, newStatus: QuoteStatus) => {
    await db.quotes.update(id, { status: newStatus });
    loadData();
  };

  const convertToOrder = async (quote: Quote) => {
    const deliveryDate = prompt('Data de Entrega (AAAA-MM-DD):', format(new Date(), 'yyyy-MM-dd'));
    if (!deliveryDate) return;

    const newOrder: Order = {
      quoteId: quote.id,
      customerId: quote.customerId,
      customerName: quote.customerName,
      items: quote.items,
      total: quote.total,
      deliveryDate,
      status: 'Pendente',
      observations: quote.observations
    };

    await db.orders.add(newOrder);
    await db.quotes.update(quote.id!, { status: QuoteStatus.APPROVED });
    alert('Pedido gerado com sucesso! Veja na aba de Pedidos.');
    loadData();
  };

  const handleDownloadPDF = async (quote: Quote) => {
    if (!settings) return alert("Configure sua empresa primeiro.");
    setLoadingPdf(quote.id || null);
    try {
      const customer = customers[quote.customerId] || { name: quote.customerName } as Customer;
      const doc = generateQuotePDF(quote, settings, customer);
      doc.save(`Orcamento_${quote.id}_${customer.name.replace(/\s+/g, '_')}.pdf`);
    } finally {
      setLoadingPdf(null);
    }
  };

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || q.id?.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.APPROVED: return 'bg-green-100 text-green-700 border-green-200';
      case QuoteStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      case QuoteStatus.PRODUCTION: return 'bg-blue-100 text-blue-700 border-blue-200';
      case QuoteStatus.DELIVERED: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case QuoteStatus.NEGOTIATING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Orçamentos</h2>
          <p className="text-gray-500 font-medium italic">Gestão completa de negociações.</p>
        </div>
        <button onClick={onNew} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
          <Plus className="mr-2 h-6 w-6" /> NOVO ORÇAMENTO
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Buscar por cliente..." className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="bg-white px-4 py-4 border border-gray-100 rounded-2xl shadow-sm outline-none font-bold text-gray-700" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos os Status</option>
          {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredQuotes.map((quote) => (
          <div key={quote.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-6 w-full lg:w-auto">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black">#{quote.id}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xl font-black text-gray-900 leading-tight truncate">{quote.customerName}</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{format(parseISO(quote.date), 'dd/MM/yyyy')} • Válido até {format(parseISO(quote.validity), 'dd/MM/yyyy')}</p>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end w-full lg:w-auto">
              <p className="text-2xl font-black text-indigo-600">R$ {quote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              
              <select 
                value={quote.status}
                onChange={(e) => handleStatusChange(quote.id!, e.target.value as QuoteStatus)}
                className={`mt-2 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border outline-none cursor-pointer transition-colors ${getStatusColor(quote.status)}`}
              >
                {Object.values(QuoteStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0">
              {quote.status !== QuoteStatus.APPROVED && (
                <button onClick={() => convertToOrder(quote)} className="p-3 text-green-600 hover:bg-green-50 rounded-xl" title="Converter em Pedido"><ShoppingBag className="h-5 w-5" /></button>
              )}
              <button onClick={() => onEdit(quote)} className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Visualizar/Editar"><Eye className="h-5 w-5" /></button>
              <button onClick={() => handleDownloadPDF(quote)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl" title="Baixar PDF"><Download className="h-5 w-5" /></button>
              <button onClick={() => handleDelete(quote.id!)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl" title="Excluir"><Trash2 className="h-5 w-5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quotes;
