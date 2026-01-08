
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Order } from '../types';
import { format, parseISO, isValid } from 'date-fns';
import { ShoppingBag, CheckCircle2, Truck, Clock, Trash2, Box, PackageCheck, AlertCircle, RefreshCcw } from 'lucide-react';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Busca direta do banco para garantir dados frescos
      const list = await db.orders.toArray();
      // Ordena por ID decrescente (mais recentes primeiro)
      setOrders(list.sort((a, b) => (b.id || 0) - (a.id || 0)));
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: number, status: Order['status']) => {
    try {
      await db.orders.update(id, { status });
      await loadOrders();
    } catch (err) {
      console.error("Erro ao atualizar status do pedido:", err);
    }
  };

  const deleteOrder = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de logística permanentemente?')) {
      await db.orders.delete(id);
      await loadOrders();
    }
  };

  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'Entregue': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pronto': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Produzindo': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Pendente': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Cancelado': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDateSafety = (dateStr: string) => {
    if (!dateStr) return 'Data não definida';
    try {
      const date = parseISO(dateStr);
      return isValid(date) ? format(date, 'dd/MM/yyyy') : dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase leading-none mb-1">Logística de Pedidos</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">Acompanhamento do fluxo produtivo.</p>
        </div>
        <button onClick={loadOrders} className="p-3 text-blue-600 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors">
          <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40">
           <Clock className="h-10 w-10 text-blue-600 animate-spin mb-4" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando banco de dados...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 opacity-5 rounded-bl-[80px] transition-transform duration-700 ${getStatusStyle(order.status).split(' ')[0]}`}></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1 min-w-0 pr-4">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1 block">Registro Logístico #{order.id}</span>
                  <h3 className="text-xl font-black text-indigo-950 truncate">{order.customerName || 'Cliente Indefinido'}</h3>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(order.status)}`}>
                  {order.status}
                </div>
              </div>

              <div className="space-y-2 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] font-bold text-indigo-950">
                    <span className="truncate pr-4">{item.quantity}x {item.name}</span>
                    <span className="text-blue-600 shrink-0">R$ {item.subtotal.toLocaleString('pt-BR')}</span>
                  </div>
                )) : (
                  <p className="text-[10px] text-slate-400 font-bold uppercase text-center italic">Sem itens vinculados</p>
                )}
                <div className="pt-4 mt-2 border-t border-slate-200 flex justify-between items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Final</span>
                  <span className="text-lg font-black text-indigo-950 leading-none">R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center text-xs text-indigo-950/60 mb-8 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <Truck className="h-5 w-5 mr-3 text-blue-600 shrink-0" />
                <span className="font-black uppercase tracking-widest text-[9px]">Previsão Entrega: {formatDateSafety(order.deliveryDate)}</span>
              </div>

              <div className="flex gap-3">
                {order.status === 'Pendente' && (
                  <button onClick={() => updateStatus(order.id!, 'Produzindo')} className="flex-1 bg-indigo-950 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-orange-500 transition-all active:scale-95 flex items-center justify-center">
                    <Clock className="mr-2 h-4 w-4" /> Produzir
                  </button>
                )}
                {order.status === 'Produzindo' && (
                  <button onClick={() => updateStatus(order.id!, 'Pronto')} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center">
                    <Box className="mr-2 h-4 w-4" /> Finalizar Prod.
                  </button>
                )}
                {order.status === 'Pronto' && (
                  <button onClick={() => updateStatus(order.id!, 'Entregue')} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center">
                    <PackageCheck className="mr-2 h-4 w-4" /> Marcar Entregue
                  </button>
                )}
                {order.status === 'Entregue' && (
                  <div className="flex-1 bg-emerald-50 text-emerald-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Concluído
                  </div>
                )}
                <button onClick={() => deleteOrder(order.id!)} className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-slate-100 active:scale-90" title="Apagar Registro">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="col-span-full py-40 text-center bg-white rounded-[50px] border-4 border-dashed border-slate-50 flex flex-col items-center">
              <ShoppingBag className="h-20 w-20 text-slate-100 mb-6" />
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Aguardando aprovação de novos orçamentos...</p>
              <button onClick={loadOrders} className="mt-6 text-blue-600 font-black uppercase text-[9px] tracking-widest hover:underline">Recarregar Lista</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
