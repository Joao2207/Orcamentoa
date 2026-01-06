
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { QuoteStatus } from '../types';
import { BarChart3, TrendingUp, PieChart, ShoppingBag, Target } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState({
    monthlyQuotes: 0,
    monthlyApproved: 0,
    monthlyRevenue: 0,
    avgTicket: 0,
    topProducts: [] as { name: string, count: number }[]
  });

  useEffect(() => {
    const calculateReports = async () => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const allQuotes = await db.quotes.toArray();
      const thisMonthQuotes = allQuotes.filter(q => {
        const d = parseISO(q.date);
        return d >= monthStart && d <= monthEnd;
      });

      const approvedThisMonth = thisMonthQuotes.filter(q => q.status === QuoteStatus.APPROVED);
      const totalRevenue = approvedThisMonth.reduce((acc, q) => acc + q.total, 0);
      
      const productCounts: Record<string, number> = {};
      allQuotes.forEach(q => {
        q.items.forEach(item => {
          productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
        });
      });

      const topProducts = Object.entries(productCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setReportData({
        monthlyQuotes: thisMonthQuotes.length,
        monthlyApproved: approvedThisMonth.length,
        monthlyRevenue: totalRevenue,
        avgTicket: approvedThisMonth.length > 0 ? totalRevenue / approvedThisMonth.length : 0,
        topProducts
      });
    };
    calculateReports();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Desempenho</h2>
        <p className="text-gray-500 font-medium italic">Visão geral do seu sucesso este mês.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <TrendingUp className="h-8 w-8 text-green-500 mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase">Receita (Mês)</p>
          <p className="text-2xl font-black text-gray-900">R$ {reportData.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <Target className="h-8 w-8 text-blue-500 mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase">Ticket Médio</p>
          <p className="text-2xl font-black text-gray-900">R$ {reportData.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <BarChart3 className="h-8 w-8 text-indigo-500 mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase">Orçamentos Criados</p>
          <p className="text-2xl font-black text-gray-900">{reportData.monthlyQuotes}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <PieChart className="h-8 w-8 text-purple-500 mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase">Taxa de Conversão</p>
          <p className="text-2xl font-black text-gray-900">
            {reportData.monthlyQuotes > 0 ? ((reportData.monthlyApproved / reportData.monthlyQuotes) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
            <ShoppingBag className="mr-2 h-6 w-6 text-indigo-600" />
            Produtos Mais Vendidos
          </h3>
          <div className="space-y-4">
            {reportData.topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="font-bold text-gray-700">{p.name}</span>
                <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full">{p.count} unid.</span>
              </div>
            ))}
            {reportData.topProducts.length === 0 && (
              <p className="text-center text-gray-400 py-10">Ainda não há dados suficientes.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
