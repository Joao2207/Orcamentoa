
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { Users, Package, FileText, CheckCircle2, Clock, Calendar, Gift, AlertCircle } from 'lucide-react';
import { format, addDays, isWithinInterval, parseISO } from 'date-fns';

interface DashboardProps {
  stats: any;
  onAction: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onAction }) => {
  const [alerts, setAlerts] = useState<{ type: string, message: string, date: string }[]>([]);

  useEffect(() => {
    const loadAlerts = async () => {
      const today = new Date();
      const next7Days = addDays(today, 7);
      const activeAlerts: any[] = [];

      // 1. Orçamentos a vencer
      const quotes = await db.quotes.where('status').equals('Pendente').toArray();
      quotes.forEach(q => {
        const validity = parseISO(q.validity);
        if (validity <= next7Days && validity >= today) {
          activeAlerts.push({ type: 'quote', message: `Orçamento #${q.id} vence em breve`, date: q.validity });
        }
      });

      // 2. Pedidos para entregar
      const orders = await db.orders.where('status').anyOf(['Pendente', 'Produzindo', 'Pronto']).toArray();
      orders.forEach(o => {
        const delivery = parseISO(o.deliveryDate);
        if (delivery <= next7Days && delivery >= today) {
          activeAlerts.push({ type: 'order', message: `Entrega de ${o.customerName} chegando`, date: o.deliveryDate });
        }
      });

      // 3. Aniversariantes
      const customers = await db.customers.toArray();
      customers.forEach(c => {
        if (c.birthday) {
          const [year, month, day] = c.birthday.split('-');
          if (parseInt(month) === today.getMonth() + 1 && Math.abs(parseInt(day) - today.getDate()) <= 3) {
            activeAlerts.push({ type: 'birthday', message: `Aniversário de ${c.name}`, date: c.birthday });
          }
        }
      });

      setAlerts(activeAlerts);
    };
    loadAlerts();
  }, []);

  const cards = [
    { title: 'Clientes', value: stats.customersCount, icon: Users, color: 'bg-blue-600', action: 'customers' },
    { title: 'Produtos', value: stats.productsCount, icon: Package, color: 'bg-purple-600', action: 'products' },
    { title: 'Orçamentos', value: stats.quotesCount, icon: FileText, color: 'bg-indigo-600', action: 'quotes' },
    { title: 'Aprovados', value: stats.approvedCount, icon: CheckCircle2, color: 'bg-green-600', action: 'quotes' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Bom dia, Emanuele!</h2>
          <p className="text-gray-500 font-medium">Aqui está o que precisa de sua atenção hoje.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{format(new Date(), 'EEEE, dd MMMM')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.title} onClick={() => onAction(card.action)} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all">
            <div className={`${card.color} p-4 rounded-2xl text-white mr-4 shadow-lg`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{card.title}</p>
              <p className="text-3xl font-black text-gray-900 leading-none mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
              <AlertCircle className="mr-2 h-6 w-6 text-orange-500" />
              Alertas Importantes
            </h3>
            {alerts.length === 0 ? (
              <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed">
                <p className="text-gray-400 font-bold">Nenhum alerta pendente para os próximos dias.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-4 ${alert.type === 'quote' ? 'bg-indigo-100 text-indigo-600' : alert.type === 'order' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                        {alert.type === 'quote' ? <Clock className="h-5 w-5" /> : alert.type === 'order' ? <Calendar className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{alert.message}</p>
                        <p className="text-xs text-gray-500 font-medium">Previsto para: {format(parseISO(alert.date), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    <button onClick={() => onAction(alert.type === 'quote' ? 'quotes' : alert.type === 'order' ? 'orders' : 'customers')} className="text-xs font-black text-indigo-600 hover:underline px-3 py-1 bg-white rounded-lg shadow-sm">VER</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden group">
            <FileText className="absolute -bottom-6 -right-6 h-32 w-32 opacity-10 rotate-12 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-black mb-4">Novo Negócio</h3>
            <p className="text-indigo-200 text-sm font-medium leading-relaxed mb-6">Comece um novo orçamento agora mesmo e encante seu cliente com profissionalismo.</p>
            <button onClick={() => onAction('quote-editor')} className="w-full bg-white text-indigo-900 font-black py-4 rounded-2xl shadow-lg hover:bg-indigo-50 transition-colors">
              CRIAR ORÇAMENTO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
