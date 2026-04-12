import { useCallback } from 'react';
import { DatabaseService } from '../DatabaseService';
import { generateId } from '../utils/id';
import { ROTULOS_TABELAS as TABLE_LABELS } from '../constants';
import { TipoTabela, AtividadeTarefa, Workspace, Cliente, ItemCobo, ItemMatrizEstrategica, ItemPlanejamento, ItemRdc, LancamentoFinancas, Tarefa, ChecklistShoot } from '../types';

export const getTableName = (tab: string): string | null => {
  switch (tab) {
    case 'CLIENTES': return 'clients';
    case 'RDC': return 'rdc';
    case 'MATRIZ': return 'matriz_estrategica';
    case 'COBO': return 'cobo';
    case 'PLANEJAMENTO': return 'planejamento';
    case 'FINANCAS': return 'financas';
    case 'TAREFAS': return 'tasks';
    case 'CHECKLISTS': return 'checklists';
    case 'VH': return 'collaborators';
    default: return null;
  }
};

const parseNumericValue = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = val.toString().replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

interface UseDataHandlersProps {
  currentWorkspace: Workspace | null;
  currentUser: any;
  clients: Cliente[];
  rdc: ItemRdc[];
  matriz: ItemMatrizEstrategica[];
  cobo: ItemCobo[];
  planejamento: ItemPlanejamento[];
  financas: LancamentoFinancas[];
  tasks: Tarefa[];
  iaHistory: any[];
  checklists: ChecklistShoot[];
  selectedClientIds: string[];
  addNotification: (tipo: any, titulo: string, mensagem: string) => void;
  setClients: React.Dispatch<React.SetStateAction<Cliente[]>>;
  setRdc: React.Dispatch<React.SetStateAction<ItemRdc[]>>;
  setMatriz: React.Dispatch<React.SetStateAction<ItemMatrizEstrategica[]>>;
  setCobo: React.Dispatch<React.SetStateAction<ItemCobo[]>>;
  setPlanejamento: React.Dispatch<React.SetStateAction<ItemPlanejamento[]>>;
  setFinancas: React.Dispatch<React.SetStateAction<LancamentoFinancas[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Tarefa[]>>;
  setChecklists: React.Dispatch<React.SetStateAction<ChecklistShoot[]>>;
  setIaHistory: React.Dispatch<React.SetStateAction<any[]>>;
  setSelection: React.Dispatch<React.SetStateAction<string[]>>;
  setDeleteModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean, ids: string[], tab: TipoTabela | 'IA_HISTORY' | null }>>;
  deleteModalState: { isOpen: boolean, ids: string[], tab: TipoTabela | 'IA_HISTORY' | null };
  deleteConfirmationText: string;
}

export function useDataHandlers({
  currentWorkspace,
  currentUser,
  clients, setClients,
  rdc, setRdc,
  matriz, setMatriz,
  cobo, setCobo,
  planejamento, setPlanejamento,
  financas, setFinancas,
  tasks, setTasks,
  checklists, setChecklists,
  iaHistory, setIaHistory,
  selectedClientIds,
  addNotification,
  setSelection,
  setDeleteModalState,
  deleteModalState,
  deleteConfirmationText,
}: UseDataHandlersProps) {

  const handleUpdate = useCallback(async (id: string, tab: TipoTabela, field: string, value: any, skipLog: boolean = false) => {
    const member = currentWorkspace?.membros_workspace?.find((m: any) => m.id_usuario === currentUser?.id);
    if (member && member.papel === 'viewer') {
      alert('Você tem permissão apenas de visualização.');
      return;
    }

    let currentList: any[] = [];
    if (tab === 'CLIENTES') currentList = clients;
    else if (tab === 'RDC') currentList = rdc;
    else if (tab === 'MATRIZ') currentList = matriz;
    else if (tab === 'COBO') currentList = cobo;
    else if (tab === 'PLANEJAMENTO') currentList = planejamento;
    else if (tab === 'FINANCAS') currentList = financas;
    else if (tab === 'TAREFAS') currentList = tasks;
    else if (tab === 'IA_HISTORY') currentList = iaHistory;

    const originalItem = currentList.find(i => i.id === id);
    if (!originalItem) return;

    let updated: any;
    if (!field) {
      updated = { ...originalItem, ...value, updated_at: new Date().toISOString() };
    } else {
      updated = { ...originalItem, [field]: value, updated_at: new Date().toISOString() };
    }

    if (tab === 'TAREFAS' && field) {
      if (field === 'Prioridade' && value === 'URGENTE') {
        addNotification('warning', 'Tarefa Urgente', `A tarefa "${originalItem.Título || 'Sem Título'}" foi marcada como URGENCIAL.`);
      }
      if (field === 'Status' && value === 'concluido') {
        addNotification('success', 'Tarefa concluída', `Tarefa marcada como concluída.`);
      }
    }

    if (field && ['Nome', 'Título', 'Conteúdo', 'Descrição'].includes(field) && !value) {
      addNotification('error', 'Campo inválido — revise', `O campo ${field} não pode ficar vazio.`);
    }


    if (tab === 'FINANCAS' && (field === 'Valor')) {
      updated.Valor = parseNumericValue(value);
    }

    if (tab === 'RDC') {
      if (["Resolução (1–5)", "Demanda (1–5)", "Competição (1–5)"].includes(field)) {
        let num = parseNumericValue(value);
        if (num > 5) num = 5;
        if (num < 1 && value !== "" && value !== 0) num = 1;
        updated[field] = num;
      }
      const r = parseNumericValue(updated["Resolução (1–5)"]);
      const d = parseNumericValue(updated["Demanda (1–5)"]);
      const c = parseNumericValue(updated["Competição (1–5)"]);
      const score = r * d * c;
      updated["Score (R×D×C)"] = score;
      if (r === 0 || d === 0 || c === 0) {
        updated["Decisão"] = "Preencha R/D/C";
      } else if (score >= 81) {
        updated["Decisão"] = "Implementar já";
      } else if (score >= 41) {
        updated["Decisão"] = "Ajustar e testar";
      } else {
        updated["Decisão"] = "Descartar e redirecionar";
      }
    }

    if (tab === 'TAREFAS' && field !== 'Atividades' && field !== 'Comentarios' && !skipLog) {
      const activity: AtividadeTarefa = {
        id: generateId(),
        tipo: field === 'Status' ? 'status_change' : 'update',
        usuario: currentUser?.email || 'Agência Ekko',
        mensagem: field === 'Status' ? `alterou o status para ${value}` : `alterou ${field.toLowerCase()} para ${value}`,
        timestamp: new Date().toISOString()
      };
      updated.Atividades = [activity, ...(updated.Atividades || [])];
    }

    const updateFn = (list: any[]) => list.map(i => i.id === id ? updated : i);
    const revertFn = (list: any[]) => list.map(i => i.id === id ? originalItem : i);

    if (tab === 'CLIENTES') setClients(updateFn);
    else if (tab === 'RDC') setRdc(updateFn);
    else if (tab === 'PLANEJAMENTO') setPlanejamento(updateFn);
    else if (tab === 'FINANCAS') setFinancas(updateFn);
    else if (tab === 'TAREFAS') setTasks(updateFn);
    else if (tab === 'CHECKLISTS') setChecklists(updateFn as any);
    else if (tab === 'COBO') setCobo(updateFn);
    else if (tab === 'MATRIZ') setMatriz(updateFn);
    else if (tab === 'IA_HISTORY') setIaHistory(updateFn);

    if (currentWorkspace) {
      const tableName = getTableName(tab);
      if (tableName) {
        const error = await DatabaseService.syncItem(tableName, updated, currentWorkspace.id);
        if (error) {
          addNotification('error', 'Falha ao salvar', `Erro: ${error.message || JSON.stringify(error) || 'Não foi possível sincronizar as alterações.'}`);
          if (tab === 'CLIENTES') setClients(revertFn);
          else if (tab === 'RDC') setRdc(revertFn);
          else if (tab === 'PLANEJAMENTO') setPlanejamento(revertFn);
          else if (tab === 'FINANCAS') setFinancas(revertFn);
          else if (tab === 'TAREFAS') setTasks(revertFn);
          else if (tab === 'CHECKLISTS') setChecklists(revertFn as any);
          else if (tab === 'COBO') setCobo(revertFn);
          else if (tab === 'MATRIZ') setMatriz(revertFn);
          else if (tab === 'IA_HISTORY') setIaHistory(revertFn);
        }
      }
    }
  }, [currentWorkspace, currentUser, addNotification, clients, rdc, matriz, cobo, planejamento, financas, tasks, iaHistory, setClients, setRdc, setMatriz, setCobo, setPlanejamento, setFinancas, setTasks, setChecklists, setIaHistory]);

  const handleAddRow = useCallback(async (tab: TipoTabela, initial: Partial<any> = {}): Promise<string | undefined> => {
    const member = currentWorkspace?.membros_workspace?.find((m: any) => m.id_usuario === currentUser?.id);
    if (member && member.papel === 'viewer') {
      alert('Você tem permissão apenas de visualização.');
      return;
    }
    if (!currentWorkspace) {
      alert("Selecione um Workspace primeiro.");
      return;
    }
    if (clients.length === 0 && !['CLIENTES', 'DASHBOARD', 'VH', 'ORGANICKIA'].includes(tab)) {
      alert('Para criar itens nesta tabela, cadastre pelo menos um Cliente primeiro.');
      return;
    }
    const id = generateId();
    const defaultClientId = selectedClientIds.length === 1 ? selectedClientIds[0] : (clients[0]?.id || 'GERAL');
    let newItem: any = null;

    if (tab === 'CLIENTES') newItem = { id, Nome: 'Novo Cliente', Nicho: '', Responsável: '', WhatsApp: '', Instagram: '', Objetivo: '', Observações: '', "Cor (HEX)": '#3B82F6', Status: 'Ativo', ...initial };
    else if (tab === 'FINANCAS') newItem = { id, Lançamento: `FIN-${generateId().toUpperCase().slice(0, 4)}`, Data: new Date().toISOString().split('T')[0], Cliente_ID: defaultClientId, Tipo: 'Entrada', Categoria: 'Serviço', Descrição: 'Novo Lançamento', Valor: 0, Recorrência: 'Única', Data_Início: new Date().toISOString().split('T')[0], Data_Fim: '', Dia_Pagamento: 1, Observações: '', ...initial };
    else if (tab === 'PLANEJAMENTO') {
      const date = initial.Data || new Date().toISOString().split('T')[0];
      newItem = { id, Cliente_ID: initial.Cliente_ID || defaultClientId, Data: date, Hora: initial.Hora || '09:00', Conteúdo: initial.Conteúdo || '', Função: initial.Função || 'Hub', Rede_Social: initial.Rede_Social || 'Instagram', "Tipo de conteúdo": initial["Tipo de conteúdo"] || '', Intenção: initial.Intenção || 'Relacionamento', Canal: initial.Canal || '', Formato: initial.Formato || '', Zona: initial.Zona || 'Morna', "Quem fala": initial["Quem fala"] || '', "Status do conteúdo": 'Pendente', ...initial };
    } else if (tab === 'TAREFAS') {
      const resp = currentUser?.email || '';
      const activity: AtividadeTarefa = {
        id: generateId(),
        tipo: 'create',
        usuario: resp || 'Agência Ekko',
        mensagem: 'criou a tarefa',
        timestamp: new Date().toISOString()
      };
      newItem = { id, Task_ID: `Tarefa-${generateId().toUpperCase().slice(0, 4)}`, Cliente_ID: initial.Cliente_ID || defaultClientId, Título: initial.Título || 'Nova Tarefa', Área: initial.Área || 'Conteúdo', Status: initial.Status || 'todo', Prioridade: initial.Prioridade || 'Média', Responsável: resp, Data_Entrega: initial.Data_Entrega || new Date().toISOString().split('T')[0], Checklist: [], Anexos: [], Comentarios: [], Atividades: [activity], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...initial };
    } else if (tab === 'COBO') newItem = { id, Cliente_ID: defaultClientId, Canal: 'Instagram', Frequência: '', Público: '', Voz: '', Zona: '', Intenção: '', Formato: '', ...initial };
    else if (tab === 'MATRIZ') newItem = { id, Cliente_ID: defaultClientId, Rede_Social: 'Instagram', Função: 'Hub', "Quem fala": '', "Papel estratégico": '', "Tipo de conteúdo": '', "Resultado esperado": '', ...initial };
    else if (tab === 'RDC') newItem = { id, Cliente_ID: defaultClientId, "Ideia de Conteúdo": '', Rede_Social: 'Instagram', "Tipo de conteúdo": '', "Resolução (1–5)": 1, "Demanda (1–5)": 1, "Competição (1–5)": 1, "Score (R×D×C)": 1, Decisão: 'Preencha R/D/C', ...initial };
    else if (tab === 'CHECKLISTS') newItem = { id, ...initial };

    if (newItem) {
      if (tab === 'CLIENTES') setClients(prev => [...prev, newItem]);
      else if (tab === 'FINANCAS') setFinancas(prev => [...prev, newItem]);
      else if (tab === 'PLANEJAMENTO') setPlanejamento(prev => [...prev, newItem]);
      else if (tab === 'TAREFAS') setTasks(prev => [...prev, newItem]);
      else if (tab === 'CHECKLISTS') setChecklists(prev => [...prev, newItem]);
      else if (tab === 'COBO') setCobo(prev => [...prev, newItem]);
      else if (tab === 'MATRIZ') setMatriz(prev => [...prev, newItem]);
      else if (tab === 'RDC') setRdc(prev => [...prev, newItem]);

      const tableName = getTableName(tab);
      if (tableName && currentWorkspace) {
        const error = await DatabaseService.syncItem(tableName, newItem, currentWorkspace.id);
        if (error) {
          const filterFn = (prev: any[]) => prev.filter(i => i.id !== id);
          if (tab === 'CLIENTES') setClients(filterFn);
          else if (tab === 'FINANCAS') setFinancas(filterFn);
          else if (tab === 'PLANEJAMENTO') setPlanejamento(filterFn);
          else if (tab === 'TAREFAS') setTasks(filterFn);
          else if (tab === 'CHECKLISTS') setChecklists(filterFn as any);
          else if (tab === 'COBO') setCobo(filterFn);
          else if (tab === 'MATRIZ') setMatriz(filterFn);
          else if (tab === 'RDC') setRdc(filterFn);
          addNotification('error', 'Erro ao salvar', `Erro: ${error.message || JSON.stringify(error) || 'O registro não pôde ser criado no servidor.'}`);
        } else {
          if (tab === 'CLIENTES') addNotification('success', 'Cliente criado com sucesso', 'Um novo perfil de cliente foi adicionado.');
          else if (tab === 'TAREFAS') addNotification('success', 'Nova tarefa adicionada', 'A tarefa foi criada no fluxo de trabalho.');
          else addNotification('success', 'Item Criado', `Novo item adicionado em ${TABLE_LABELS[tab]}.`);
        }
      }
    }
    return id;
  }, [currentWorkspace, selectedClientIds, clients, currentUser, addNotification, setClients, setFinancas, setPlanejamento, setTasks, setChecklists, setCobo, setMatriz, setRdc]);

  const performDelete = useCallback((ids: string[], tab: TipoTabela | 'IA_HISTORY') => {
    const member = currentWorkspace?.membros_workspace?.find((m: any) => m.id_usuario === currentUser?.id);
    if (member && member.papel === 'viewer') {
      alert('Você tem permissão apenas de visualização.');
      return;
    }
    if (ids.length === 0) return;
    setDeleteModalState({ isOpen: true, ids, tab });
  }, [currentWorkspace, currentUser, setDeleteModalState]);

  const executeDelete = useCallback(() => {
    const { ids, tab } = deleteModalState;
    if (!tab || ids.length === 0) return;
    if (deleteConfirmationText.toUpperCase() !== 'EXCLUIR') return;

    if (tab === 'CLIENTES') setClients(prev => prev.filter(c => !ids.includes(c.id)));
    if (tab === 'RDC') setRdc(prev => prev.filter(r => !ids.includes(r.id)));
    if (tab === 'MATRIZ') setMatriz(prev => prev.filter(m => !ids.includes(m.id)));
    if (tab === 'COBO') setCobo(prev => prev.filter(c => !ids.includes(c.id)));
    if (tab === 'PLANEJAMENTO') setPlanejamento(prev => prev.filter(p => !ids.includes(p.id)));
    if (tab === 'FINANCAS') setFinancas(prev => prev.filter(f => !ids.includes(f.id)));
    if (tab === 'TAREFAS') setTasks(prev => prev.filter(t => !ids.includes(t.id)));
    if (tab === 'CHECKLISTS') setChecklists(prev => prev.filter(c => !ids.includes(c.id)));
    if (tab === 'IA_HISTORY') setIaHistory(prev => prev.filter(h => !ids.includes(h.id)));
    setSelection([]);

    if (currentWorkspace) {
      const tableName = getTableName(tab as string);
      if (tableName) {
        ids.forEach(id => DatabaseService.deleteItem(tableName, id));
        addNotification('error', 'Item removido', `${ids.length} item(s) excluído(s).`);
      }
    }
    
    setDeleteModalState({ isOpen: false, ids: [], tab: null });
  }, [currentWorkspace, deleteModalState, deleteConfirmationText, addNotification, setClients, setRdc, setMatriz, setCobo, setPlanejamento, setFinancas, setTasks, setChecklists, setIaHistory, setSelection, setDeleteModalState]);

  const performArchive = useCallback((ids: string[], tab: TipoTabela | 'IA_HISTORY', archive: boolean = true) => {
    if (ids.length === 0) return;
    const updateFn = (list: any[]) => list.map(i => ids.includes(i.id) ? { ...i, __archived: archive } : i);

    if (tab === 'CLIENTES') setClients(updateFn);
    if (tab === 'RDC') setRdc(updateFn);
    if (tab === 'MATRIZ') setMatriz(updateFn);
    if (tab === 'COBO') setCobo(updateFn);
    if (tab === 'PLANEJAMENTO') setPlanejamento(updateFn);
    if (tab === 'FINANCAS') setFinancas(updateFn);
    if (tab === 'TAREFAS') setTasks(updateFn);
    if (tab === 'CHECKLISTS') setChecklists(updateFn as any);
    if (tab === 'IA_HISTORY') setIaHistory(updateFn);
    setSelection([]);

    if (currentWorkspace) {
      const tableName = getTableName(tab as string);
      if (tableName) {
        ids.forEach(id => DatabaseService.updateItem(tableName, id, { __archived: archive }));
      }
    }
  }, [currentWorkspace, setClients, setRdc, setMatriz, setCobo, setPlanejamento, setFinancas, setTasks, setChecklists, setIaHistory, setSelection]);

  return { handleUpdate, handleAddRow, performDelete, executeDelete, performArchive };
}
