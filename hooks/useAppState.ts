import { useState } from 'react';
import {
  Cliente, ItemCobo, ItemMatrizEstrategica, ItemPlanejamento,
  ItemRdc, LancamentoFinancas, Tarefa, ChecklistShoot, Colaborador
} from '../types';

export function useAppState() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [cobo, setCobo] = useState<ItemCobo[]>([]);
  const [matriz, setMatriz] = useState<ItemMatrizEstrategica[]>([]);
  const [planejamento, setPlanejamento] = useState<ItemPlanejamento[]>([]);
  const [rdc, setRdc] = useState<ItemRdc[]>([]);
  const [financas, setFinancas] = useState<LancamentoFinancas[]>([]);
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [checklists, setChecklists] = useState<ChecklistShoot[]>([]);
  const [collaborators, setCollaborators] = useState<Colaborador[]>([]);
  const [iaHistory, setIaHistory] = useState<any[]>([]);

  return {
    clients, setClients,
    cobo, setCobo,
    matriz, setMatriz,
    planejamento, setPlanejamento,
    rdc, setRdc,
    financas, setFinancas,
    tasks, setTasks,
    checklists, setChecklists,
    collaborators, setCollaborators,
    iaHistory, setIaHistory,
  };
}
