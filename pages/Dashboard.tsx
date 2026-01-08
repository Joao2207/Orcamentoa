
import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { 
  Users, 
  Package, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight, 
  Sparkles, 
  ChevronRight, 
  Wallet,
  ChevronLeft,
  Plus,
  StickyNote,
  X,
  Trash2,
  Zap
} from 'lucide-react';
import { 
  format, 
  addDays, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  stats: any;
  onAction: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onAction }) => {
  const [alerts, setAlerts] = useState<{ type: string, message: string, date: string }[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [calendarNotes, setCalendarNotes] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const loadCalendarData = async () => {
    const quotes = await db.quotes.where('deliveryDate').between(
      format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
      true, true
    ).toArray();
    
    const notes = await db.calendarNotes.where('date').between(
      format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
      true, true
    ).toArray();

    setEncomendas(quotes);
    setCalendarNotes(notes);
  };

  useEffect(() => {
    const loadAlerts = async () => {
      const today = new Date();
      const next7Days = addDays(today, 7);
      const activeAlerts: any[] = [];
      const quotes = await db.quotes.where('status').equals('Pendente').toArray();
      quotes.forEach(q => {
        const validity = parseISO(q.validity);
        if (validity <= next7Days && validity >= today) {
          activeAlerts.push({ type: 'quote', message: `Expira: ${q.customerName}`, date: q.validity });
        }
      });
      setAlerts(activeAlerts);
    };
    loadAlerts();
    loadCalendarData();
  }, [currentMonth]);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    const existingNote = calendarNotes.find(n => n.date === format(day, 'yyyy-MM-dd'));
    setNoteText(existingNote ? existingNote.text : '');
    setIsNoteModalOpen(true);
  };

  const saveNote = async () => {
    if (!selectedDay) return;
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const existing = await db.calendarNotes.where('date').equals(dateStr).first();
    
    if (noteText.trim()) {
      if (existing) {
        await db.calendarNotes.update(existing.id!, { text: noteText });
      } else {
        await db.calendarNotes.add({ date: dateStr, text: noteText });
      }
    } else if (existing) {
      await db.calendarNotes.delete(existing.id!);
    }
    
    setIsNoteModalOpen(false);
    loadCalendarData();
  };

  // Calendar Grid
  const days = eachDayOfInterval({ 
    start: startOfWeek(startOfMonth(currentMonth)), 
    end: endOfWeek(endOfMonth(currentMonth)) 
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
      {/* HEADER DINÂMICO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
               <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-4xl font-black text-indigo-950 tracking-tighter leading-none">Visão Geral</h2>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] ml-1">Emanuelle, sua gestão está em dia.</p>
        </div>

        {/* ATALHOS RÁPIDOS */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onAction('quote-editor')} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo Orçamento
          </button>
          <button onClick={() => onAction('customers')} className="bg-white border border-slate-100 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-indigo-950 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <Users className="h-4 w-4" /> Clientes
          </button>
        </div>
      </div>

      {/* CARDS DE PERFORMANCE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Faturamento Semana', val: `R$ ${stats.weeklyRevenue.toLocaleString('pt-BR')}`, icon: Wallet, col: 'blue' },
          { label: 'Faturamento Mês', val: `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')}`, icon: TrendingUp, col: 'indigo' },
          { label: 'Orçamentos Totais', val: stats.quotesCount, icon: FileText, col: 'slate' },
          { label: 'Base Clientes', val: stats.customersCount, icon: Users, col: 'sky' }
        ].map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-950 group-hover:text-white transition-colors">
                  <c.icon className="h-5 w-5" />
               </div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.label}</p>
            </div>
            <p className="text-2xl font-black text-indigo-950 tracking-tighter">{c.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CALENDÁRIO INTELIGENTE */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[48px] shadow-sm border border-slate-100 h-full">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                  <h3 className="text-xl font-black text-indigo-950 tracking-tighter uppercase">Agenda de Entregas</h3>
               </div>
               <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-950 min-w-[120px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><ChevronRight className="h-4 w-4" /></button>
               </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="text-center text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">{d}</div>
              ))}
              {days.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayEncomendas = encomendas.filter(e => e.deliveryDate === dateStr);
                const hasNote = calendarNotes.some(n => n.date === dateStr);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                return (
                  <div 
                    key={idx} 
                    onClick={() => handleDayClick(day)}
                    className={`
                      relative h-20 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1
                      ${!isCurrentMonth ? 'opacity-10 pointer-events-none' : 'hover:border-blue-300 hover:shadow-lg'}
                      ${isToday(day) ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-105 z-10' : 'bg-white border-slate-50'}
                    `}
                  >
                    <span className={`text-xs font-black ${isToday(day) ? 'text-white' : 'text-indigo-950'}`}>{format(day, 'd')}</span>
                    <div className="flex gap-1">
                      {dayEncomendas.length > 0 && (
                        <div className={`w-2 h-2 rounded-full ${isToday(day) ? 'bg-white' : 'bg-blue-600 animate-pulse'}`}></div>
                      )}
                      {hasNote && (
                        <div className={`w-2 h-2 rounded-full ${isToday(day) ? 'bg-indigo-300' : 'bg-amber-400'}`}></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUNA LATERAL: ALERTAS E ATALHOS */}
        <div className="space-y-6">
          <div className="bg-indigo-950 p-8 rounded-[48px] shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <Zap className="h-8 w-8 text-blue-400 mb-6" />
            <h3 className="text-2xl font-black tracking-tighter mb-2">Acesso Rápido</h3>
            <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-8 opacity-70">Gerencie seus orçamentos</p>
            <button onClick={() => onAction('quotes')} className="w-full bg-white text-indigo-950 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-400 hover:text-white transition-all active:scale-95">
              Visualizar Todos
            </button>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-950">Vencimentos Próximos</h3>
             </div>
             <div className="space-y-3">
               {alerts.length === 0 ? (
                 <p className="text-[10px] text-slate-300 font-bold uppercase text-center py-4">Sem pendências para hoje</p>
               ) : (
                 alerts.map((a, i) => (
                   <div key={i} className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
                     <span className="text-[10px] font-black text-red-700 uppercase truncate pr-4">{a.message}</span>
                     <button onClick={() => onAction('quotes')} className="text-red-700"><ArrowUpRight className="h-4 w-4" /></button>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES DO DIA */}
      {isNoteModalOpen && selectedDay && (
        <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[50px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-950 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">{format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}</h3>
                <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Gestão do Dia</p>
              </div>
              <button onClick={() => setIsNoteModalOpen(false)} className="p-3 bg-white/10 rounded-2xl hover:bg-red-500 transition-all"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Entregas do Dia */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4 text-blue-600" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregas Agendadas</h4>
                </div>
                <div className="space-y-2">
                  {encomendas.filter(e => e.deliveryDate === format(selectedDay, 'yyyy-MM-dd')).length > 0 ? (
                    encomendas.filter(e => e.deliveryDate === format(selectedDay, 'yyyy-MM-dd')).map((e, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                         <span className="font-black text-indigo-950 text-xs">{e.customerName}</span>
                         <span className="text-[9px] font-black text-blue-600 uppercase">R$ {e.total.toLocaleString('pt-BR')}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-300 font-bold uppercase italic py-2">Nenhuma entrega prevista.</p>
                  )}
                </div>
              </div>

              {/* Notas do Dia */}
              <div className="pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 mb-4">
                  <StickyNote className="h-4 w-4 text-amber-500" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas e Lembretes</h4>
                </div>
                <textarea 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-indigo-950 outline-none focus:ring-4 focus:ring-blue-100 min-h-[120px] transition-all"
                  placeholder="Anotar algo importante..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                />
              </div>

              <button onClick={saveNote} className="w-full bg-indigo-950 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
