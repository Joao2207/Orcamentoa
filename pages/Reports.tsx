
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { QuoteStatus } from '../types';
import { BarChart3, TrendingUp, PieChart, Target, Wallet, Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, startOfWeek } from 'date-fns';

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState({
    monthlyQuotes: 0,
    monthlyApproved: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    pipelineValue: 0, 
    avgTicket: 0,
    topProducts: [] as { name: string, count: number }[],
    statusDistribution: [] as { status: string, count: number, color: string, percentage: number }[]
  });

  const calculateReports = async () => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const weekStart = startOfWeek(now);
      const allQuotes = await db.quotes.toArray();

      const realizedStatuses = [QuoteStatus.APPROVED, QuoteStatus.PRODUCTION, QuoteStatus.DELIVERED];
      const thisMonthQuotes = allQuotes.filter(q => parseISO(q.date) >= monthStart);
      const approvedMonthly = thisMonthQuotes.filter(q => realizedStatuses.includes(q.status));
      const monthlyRevenue = approvedMonthly.reduce((acc, q) => acc + q.total, 0);

      const approvedWeekly = allQuotes.filter(q => parseISO(q.date) >= weekStart && realizedStatuses.includes(q.status));
      const weeklyRevenue = approvedWeekly.reduce((acc, q) => acc + q.total, 0);
      
      const productCounts: Record<string, number> = {};
      allQuotes.forEach(q => {
        if (realizedStatuses.includes(q.status)) {
          q.items.forEach(item => { productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity; });
        }
      });

      const topProducts = Object.entries(productCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count).slice(0, 5);

      const statusCounts: Record<string, number> = {};
      allQuotes.forEach(q => { statusCounts[q.status] = (statusCounts[q.status] || 0) + 1; });

      const statusColors: Record<string, string> = {
        [QuoteStatus.APPROVED]: 'bg-emerald-500',
        [QuoteStatus.PENDING]: 'bg-orange-400',
        [QuoteStatus.NEGOTIATING]: 'bg-blue-400',
        [QuoteStatus.PRODUCTION]: 'bg-indigo-500',
        [QuoteStatus.DELIVERED]: 'bg-blue-600',
        [QuoteStatus.CANCELLED]: 'bg-red-400'
      };

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        color: statusColors[status as QuoteStatus] || 'bg-slate-300',
        percentage: (count / (allQuotes.length || 1)) * 100
      }));

      setReportData({
        monthlyQuotes: thisMonthQuotes.length,
        monthlyApproved: approvedMonthly.length,
        monthlyRevenue,
        weeklyRevenue,
        pipelineValue: 0,
        avgTicket: approvedMonthly.length > 0 ? monthlyRevenue / approvedMonthly.length : 0,
        topProducts,
        statusDistribution
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { calculateReports(); }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-indigo-950 tracking-tighter uppercase mb-2">Painel Financeiro</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">Análise de rentabilidade e conversão.</p>
        </div>
        <button onClick={calculateReports} className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-all">
           <Clock className="h-4 w-4 text-blue-600" />
           <p className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">Atualizado: {format(new Date(), 'HH:mm')}</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-600 p-8 rounded-[40px] shadow-xl text-white group hover:scale-[1.02] transition-all">
          <Calendar className="h-8 w-8 text-blue-200 mb-6" />
          <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">Total Semanal</p>
          <p className="text-3xl font-black">R$ {reportData.weeklyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
          <TrendingUp className="h-8 w-8 text-emerald-500 mb-6" />
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Mensal</p>
          <p className="text-3xl font-black text-indigo-950">R$ {reportData.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
          <Wallet className="h-8 w-8 text-purple-500 mb-6" />
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Médio</p>
          <p className="text-3xl font-black text-indigo-950">R$ {reportData.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-indigo-950 uppercase tracking-widest mb-10 flex items-center">
            <PieChart className="mr-3 h-6 w-6 text-blue-600" /> Funil de Conversão
          </h3>
          <div className="space-y-4">
             {reportData.statusDistribution.map((s, idx) => (
               <div key={idx} className="space-y-2">
                 <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <span>{s.status}</span>
                    <span>{s.count} propostas</span>
                 </div>
                 <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} transition-all duration-1000`} style={{ width: `${s.percentage}%` }}></div>
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-indigo-950 uppercase tracking-widest mb-10 flex items-center">
            <Target className="mr-3 h-6 w-6 text-blue-600" /> Top Itens
          </h3>
          <div className="space-y-3">
            {reportData.topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                <span className="font-black text-indigo-950 text-xs">{p.name}</span>
                <span className="text-[10px] font-black text-blue-600 bg-white px-3 py-1 rounded-lg shadow-sm">{p.count} unid.</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
