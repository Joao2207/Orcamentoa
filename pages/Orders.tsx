
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Order } from '../types';
import { format, parseISO } from 'date-fns';
import { ShoppingBag, CheckCircle2, Truck, Clock, Trash2 } from 'lucide-react';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = async () => {
    const list = await db.orders.reverse().toArray();
    setOrders(list);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: number, status: Order['status']) => {
    await db.orders.update(id, { status });
    loadOrders();
  };

  const deleteOrder = async (id: number) => {
    if (confirm('Excluir este pedido?')) {
      await db.orders.delete(id);
      loadOrders();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Pedidos Ativos</h2>
          <p className="text-gray-500 font-medium">Controle sua produção e entregas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Pedido #{order.id}</span>
                <h3 className="text-xl font-black text-gray-900">{order.customerName}</h3>
              </div>
              <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                order.status === 'Entregue' ? 'bg-green-100 text-green-700' :
                order.status === 'Pronto' ? 'bg-blue-100 text-blue-700' :
                order.status === 'Produzindo' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {order.status}
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>{item.quantity}x {item.name}</span>
                  <span>R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between font-black text-indigo-900">
                <span>TOTAL</span>
                <span>R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-2xl">
              <Truck className="h-4 w-4 mr-2 text-indigo-600" />
              <span className="font-bold">Entrega prevista: {format(parseISO(order.deliveryDate), 'dd/MM/yyyy')}</span>
            </div>

            <div className="flex gap-2">
              {order.status !== 'Produzindo' && order.status !== 'Entregue' && (
                <button onClick={() => updateStatus(order.id!, 'Produzindo')} className="flex-1 bg-orange-50 text-orange-700 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-100">Iniciar</button>
              )}
              {order.status === 'Produzindo' && (
                <button onClick={() => updateStatus(order.id!, 'Pronto')} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100">Finalizar</button>
              )}
              {order.status === 'Pronto' && (
                <button onClick={() => updateStatus(order.id!, 'Entregue')} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700">Entregar</button>
              )}
              <button onClick={() => deleteOrder(order.id!)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="h-5 w-5" /></button>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Nenhum pedido em aberto no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
