
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../supabase';
import { DatabaseService } from '../DatabaseService';
import {
    Cliente, ItemCobo, ItemMatrizEstrategica, ItemPlanejamento, ItemRdc,
    LancamentoFinancas, Tarefa, Colaborador, VhConfig, Workspace,
    PerfilUsuario, NotificacaoApp, DadosModelagemSistematica
} from '../types';
import { CONFIG_VH_PADRAO } from '../constants';

interface AppContextType {
    clientes: Cliente[];
    setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
    cobo: ItemCobo[];
    setCobo: React.Dispatch<React.SetStateAction<ItemCobo[]>>;
    matriz: ItemMatrizEstrategica[];
    setMatriz: React.Dispatch<React.SetStateAction<ItemMatrizEstrategica[]>>;
    planejamento: ItemPlanejamento[];
    setPlanejamento: React.Dispatch<React.SetStateAction<ItemPlanejamento[]>>;
    rdc: ItemRdc[];
    setRdc: React.Dispatch<React.SetStateAction<ItemRdc[]>>;
    financas: LancamentoFinancas[];
    setFinancas: React.Dispatch<React.SetStateAction<LancamentoFinancas[]>>;
    tarefas: Tarefa[];
    setTarefas: React.Dispatch<React.SetStateAction<Tarefa[]>>;
    colaboradores: Colaborador[];
    setColaboradores: React.Dispatch<React.SetStateAction<Colaborador[]>>;
    configVh: VhConfig;
    setConfigVh: React.Dispatch<React.SetStateAction<VhConfig>>;
    modelagemSistematica: DadosModelagemSistematica;
    setModelagemSistematica: React.Dispatch<React.SetStateAction<DadosModelagemSistematica>>;
    workspaces: Workspace[];
    workspaceAtual: Workspace | null;
    setWorkspaceAtual: React.Dispatch<React.SetStateAction<Workspace | null>>;
    usuarioAtual: any;
    perfilUsuario: PerfilUsuario | null;
    notificacoes: NotificacaoApp[];
    setNotificacoes: React.Dispatch<React.SetStateAction<NotificacaoApp[]>>;
    carregando: boolean;
    refreshWorkspaces: () => Promise<void>;
    carregarDadosWorkspace: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [cobo, setCobo] = useState<ItemCobo[]>([]);
    const [matriz, setMatriz] = useState<ItemMatrizEstrategica[]>([]);
    const [planejamento, setPlanejamento] = useState<ItemPlanejamento[]>([]);
    const [rdc, setRdc] = useState<ItemRdc[]>([]);
    const [financas, setFinancas] = useState<LancamentoFinancas[]>([]);
    const [tarefas, setTarefas] = useState<Tarefa[]>([]);
    const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
    const [configVh, setConfigVh] = useState<VhConfig>(CONFIG_VH_PADRAO);
    const [modelagemSistematica, setModelagemSistematica] = useState<DadosModelagemSistematica>({});

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [workspaceAtual, setWorkspaceAtual] = useState<Workspace | null>(null);
    const [usuarioAtual, setUsuarioAtual] = useState<any>(null);
    const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
    const [notificacoes, setNotificacoes] = useState<NotificacaoApp[]>([]);
    const [carregando, setCarregando] = useState(true);

    const mergeItems = (local: any[], remote: any[]) => {
        const merged = [...local];
        remote.forEach(remoteItem => {
            const index = merged.findIndex(i => i.id === remoteItem.id);
            if (index === -1) {
                merged.push(remoteItem);
            } else {
                const remoteDate = remoteItem.updated_at ? new Date(remoteItem.updated_at).getTime() : 0;
                const localDate = merged[index].updated_at ? new Date(merged[index].updated_at).getTime() : 0;
                if (remoteDate > localDate) merged[index] = remoteItem;
            }
        });
        return merged;
    };

    const carregarDadosWorkspace = useCallback(async (id: string) => {
        const data = await DatabaseService.fetchAllWorkspaceData(id);
        if (data) {
            setClientes(prev => mergeItems(prev, data.clients));
            setCobo(prev => mergeItems(prev, data.cobo));
            setMatriz(prev => mergeItems(prev, data.matriz));
            setRdc(prev => mergeItems(prev, data.rdc));
            setPlanejamento(prev => mergeItems(prev, data.planning));
            setFinancas(prev => mergeItems(prev, data.financas));
            setTarefas(prev => mergeItems(prev, data.tasks));
            setColaboradores(prev => mergeItems(prev, data.collaborators));
        }
    }, []);

    const refreshWorkspaces = useCallback(async () => {
        if (!usuarioAtual) return;
        try {
            const list = await DatabaseService.getMyWorkspaces();
            setWorkspaces(list);
            if (list.length === 0) {
                const created = await DatabaseService.createWorkspace('Meu Workspace');
                setWorkspaces([created]);
                setWorkspaceAtual(created);
            } else if (!workspaceAtual) {
                setWorkspaceAtual(list[0]);
            }
        } catch (error) {
            console.error('Erro ao carregar workspaces:', error);
        }
    }, [usuarioAtual, workspaceAtual]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUsuarioAtual(user);
            if (user) {
                supabase.from('profiles').select('*').eq('id', user.id).single()
                    .then(({ data }) => setPerfilUsuario(data));
            }
            setCarregando(false);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUsuarioAtual(session?.user ?? null);
            if (session?.user) {
                supabase.from('profiles').select('*').eq('id', session.user.id).single()
                    .then(({ data }) => setPerfilUsuario(data));
            } else {
                setPerfilUsuario(null);
            }
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (usuarioAtual) refreshWorkspaces();
    }, [usuarioAtual, refreshWorkspaces]);

    useEffect(() => {
        if (workspaceAtual) carregarDadosWorkspace(workspaceAtual.id);
    }, [workspaceAtual, carregarDadosWorkspace]);

    return (
        <AppContext.Provider value={{
            clientes, setClientes, cobo, setCobo, matriz, setMatriz,
            planejamento, setPlanejamento, rdc, setRdc, financas, setFinancas,
            tarefas, setTarefas, colaboradores, setColaboradores, configVh, setConfigVh,
            modelagemSistematica, setModelagemSistematica, workspaces, workspaceAtual, setWorkspaceAtual,
            usuarioAtual, perfilUsuario, notificacoes, setNotificacoes, carregando,
            refreshWorkspaces, carregarDadosWorkspace
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) throw new Error('useApp deve ser usado dentro de um AppProvider');
    return context;
};
