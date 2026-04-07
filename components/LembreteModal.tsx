import React, { useState, useEffect } from 'react';
import { Lembrete, LembreteTipo, Cliente } from '../types';
import ReactDOM from 'react-dom';
import { X, Save, Calendar, Clock, Tag, User, AlignLeft } from 'lucide-react';
import { playUISound } from '../utils/uiSounds';

interface LembreteModalProps {
  lembrete: Partial<Lembrete> | null;
  clients: Cliente[];
  onClose: () => void;
  onSave: (lembrete: Partial<Lembrete>) => void;
}

export function LembreteModal({ lembrete, clients, onClose, onSave }: LembreteModalProps) {
  const [formData, setFormData] = useState<Partial<Lembrete>>({
    titulo: '',
    data: new Date().toISOString().split('T')[0],
    hora: '09:00',
    tipo: 'Tarefa',
    cliente_id: '',
    descricao: '',
    concluido: false,
    auto_gerado: false
  });

  useEffect(() => {
    if (lembrete) {
      setFormData({
        ...formData,
        ...lembrete
      });
    }
  }, [lembrete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playUISound('success');
    onSave(formData);
  };

  const tipos: LembreteTipo[] = ['Post', 'Reunião', 'Pagamento', 'Tarefa', 'Contrato', 'Outro'];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden transform animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white uppercase">
                {lembrete?.id ? 'Editar Lembrete' : 'Novo Lembrete'}
              </h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Gerencie seus alertas e tarefas
              </p>
            </div>
          </div>
          <button 
            onClick={() => { playUISound('close'); onClose(); }}
            className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-zinc-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={12} /> Título do Lembrete
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Reunião de Alinhamento"
              className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Data */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} /> Data
              </label>
              <input
                type="date"
                required
                value={formData.data}
                onChange={e => setFormData({ ...formData, data: e.target.value })}
                className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
              />
            </div>

            {/* Hora */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} /> Hora
              </label>
              <input
                type="time"
                value={formData.hora}
                onChange={e => setFormData({ ...formData, hora: e.target.value })}
                className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Tipo */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} /> Categoria
              </label>
              <select
                value={formData.tipo}
                onChange={e => setFormData({ ...formData, tipo: e.target.value as LembreteTipo })}
                className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold appearance-none"
              >
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Cliente (Opcional)
              </label>
              <select
                value={formData.cliente_id || ''}
                onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}
                className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold appearance-none"
              >
                <option value="">Nenhum</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.Nome}</option>)}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <AlignLeft size={12} /> Descrição
            </label>
            <textarea
              value={formData.descricao || ''}
              onChange={e => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Detalhes adicionais..."
              className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-bold min-h-[100px] resize-none"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => { playUISound('close'); onClose(); }}
              className="flex-1 px-6 py-4 rounded-2xl font-black tracking-widest text-[10px] uppercase text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-4 rounded-2xl font-black tracking-widest text-[10px] uppercase text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Save size={16} /> Salvar Lembrete
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
