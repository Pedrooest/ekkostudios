import { supabase } from './supabase';
import {
    Cliente, ItemCobo, ItemMatrizEstrategica, ItemRdc, ItemPlanejamento,
    LancamentoFinancas, Tarefa, Colaborador, VhConfig, DadosModelagemSistematica,
    Workspace, MembroWorkspace, Convite, Lembrete
} from './types';

// Mapeamento de nomes de colunas do Banco para nomes em Português nas Interfaces
const MAPA_COLUNAS: Record<string, Record<string, string>> = {
    workspaces: {
        name: 'nome',
        color: 'cor',
        avatar_url: 'avatar_url',
        owner_id: 'id_proprietario',
        created_at: 'criado_em'
    },
    workspace_members: {
        workspace_id: 'id_workspace',
        user_id: 'id_usuario',
        role: 'papel',
        joined_at: 'entrou_em'
    },
    invites: {
        workspace_id: 'id_workspace',
        expires_at: 'expira_em',
        role: 'papel'
    },
    financas: {
        id: 'id',
        workspace_id: 'workspace_id'
    },
    tasks: {
        Activities: 'Atividades',
        Task_ID: 'id', // Mapping database Task_ID to frontend id if needed
        Cliente_ID: 'clienteId',
        Título: 'titulo',
        Descrição: 'descricao',
        Área: 'area',
        Status: 'status',
        Prioridade: 'prioridade',
        Responsável: 'responsavel',
        Data_Entrega: 'dataEntrega',
        Hora_Entrega: 'horaEntrega',
        Tempo_Gasto_H: 'tempoGasto',
        Estimativa_H: 'estimativa',
        Relacionado_A: 'relacionadoA',
        Relacionado_ID: 'relacionadoId',
        Relacionado_Conteudo: 'relacionadoConteudo'
    },
    rdc: {
        Cliente_ID: 'clienteId',
        "Ideia de Conteúdo": 'ideia',
        Rede_Social: 'redeSocial',
        "Tipo de conteúdo": 'tipoConteudo',
        "Resolução (1–5)": 'resolucao',
        "Demanda (1–5)": 'demanda',
        "Competição (1–5)": 'competicao',
        "Score (R×D×C)": 'score',
        Decisão: 'decisao'
    },
    cobo: {
        Cliente_ID: 'clienteId',
        Canal: 'canal',
        Frequência: 'frequencia',
        Público: 'publico',
        Voz: 'voz',
        Zona: 'zona',
        Intenção: 'intencao',
        Formato: 'formato'
    },
    matriz_estrategica: {
        Cliente_ID: 'clienteId',
        Rede_Social: 'redeSocial',
        Função: 'funcao',
        "Quem fala": 'quemFala',
        "Papel estratégico": 'papelEstrategico',
        "Tipo de conteúdo": 'tipoConteudo',
        "Resultado esperado": 'resultadoEsperado'
    },
    planejamento: {
        Cliente_ID: 'clienteId',
        Data: 'data',
        Hora: 'hora',
        Conteúdo: 'conteudo',
        Função: 'funcao',
        Rede_Social: 'redeSocial',
        "Tipo de conteúdo": 'tipoConteudo',
        Intenção: 'intencao',
        Canal: 'canal',
        Formato: 'formato',
        Zona: 'zona',
        "Quem fala": 'quemFala',
        "Status do conteúdo": 'status'
    },
    checklists: {
        cliente_id: 'client',
        titulo: 'title',
        data: 'date',
        local: 'location',
        observacoes: 'notes',
        hora: 'time',
        status: 'status'
    }
};

const VALID_FIELDS: Record<string, string[]> = {
    financas: [
        'id', 'workspace_id', 'Lançamento', 'Data', 'Cliente_ID', 'Tipo',
        'Categoria', 'Descrição', 'Valor', 'Recorrência', 'Data_Início',
        'Data_Fim', 'Dia_Pagamento', 'Observações', 'Status', 'updated_at',
        '_auto_gerado', '_origem_id', '__archived', 'created_at', 'created_by', 'updated_by',
        'descricao', 'valor', 'data', 'tipo', 'categoria', 'status', 'frequencia', 'clienteId', 'diaPagamento'
    ],
    clients: [
        'id', 'workspace_id', 'Nome', 'Nicho', 'Responsável', 'WhatsApp',
        'Instagram', 'Objetivo', 'Observações', 'Cor (HEX)', 'Status',
        'updated_at', 'links', 'log_comunicacao', 'assets', 'paleta_cores',
        'fontes', 'tom_de_voz', 'metas', 'Fee', '__archived', 'created_at', 'created_by', 'updated_by'
    ],
    tasks: [
        'id', 'workspace_id', 'Task_ID', 'Cliente_ID', 'Título', 'Descrição', 
        'Área', 'Status', 'Prioridade', 'Responsável', 'Data_Entrega', 'Hora_Entrega',
        'Checklist', 'Anexos', 'Comentarios', 'Atividades', 'Criado_Em', 'updated_at',
        'Tempo_Gasto_H', 'Tags', 'Estimativa_H', 'Relacionado_A', 'Relacionado_ID',
        'Relacionado_Conteudo', '__archived', 'created_at', 'created_by', 'updated_by'
    ],
    rdc: [
        'id', 'workspace_id', 'Cliente_ID', 'Ideia de Conteúdo', 'Rede_Social',
        'Tipo de conteúdo', 'Resolução (1–5)', 'Demanda (1–5)',
        'horasMensais', 'updated_at',
        '__archived', 'created_at', 'created_by', 'updated_by'
    ],
    checklists: [
        'id', 'workspace_id', 'titulo', 'data', 'cliente_id', 'local',
        'observacoes', 'status', 'itens_levar', 'itens_trazer',
        'itens_gravar', 'updated_at', 'hora',
        '__archived', 'created_at', 'created_by', 'updated_by'
    ],
    reunioes: [
        'id', 'workspace_id', 'cliente_id', 'titulo', 'data', 'hora',
        'formato', 'participantes', 'pauta', 'decisoes',
        'proximos_passos', 'status', 'updated_at',
        '__archived', 'created_at', 'created_by', 'updated_by'
    ],
    lembretes: [
        'id', 'workspace_id', 'titulo', 'data', 'hora', 'tipo',
        'cliente_id', 'descricao', 'concluido', 'auto_gerado', 'updated_at',
        '__archived', 'created_at', 'created_by', 'updated_by'
    ],
    retiradas_socios: [
        'id', 'workspace_id', 'socio', 'valor', 'data',
        'mes_referencia', 'observacao', 'updated_at',
        '__archived', 'created_at', 'created_by', 'updated_by'
    ],
    cobo: [
        'id', 'workspace_id', 'Cliente_ID', 'Canal', 'Frequência',
        'Público', 'Voz', 'Zona', 'Intenção', 'Formato', 'updated_at',
        '__archived', 'created_at', 'created_by', 'updated_by'
    ],
    matriz_estrategica: [
        'id', 'workspace_id', 'Cliente_ID', 'Rede_Social', 'Função',
        'Quem fala', 'Papel estratégico', 'Tipo de conteúdo', 'Resultado esperado',
        'updated_at', '__archived', 'created_at', 'created_by', 'updated_by'
    ],
    planejamento: [
        'id', 'workspace_id', 'Cliente_ID', 'Data', 'Hora', 'Conteúdo',
        'Função', 'Rede_Social', 'Tipo de conteúdo', 'Intenção', 'Canal',
        'Formato', 'Zona', 'Quem fala', 'Status do conteúdo', 'updated_at',
        'google_event_id', '__archived', 'created_at', 'created_by', 'updated_by'
    ],
    collaborators: [
        'id', 'workspace_id', 'Nome', 'Cargo', 'Remuneracao', 'HorasProdutivas',
        'calculatedVh', 'updated_at', '__archived', 'created_at', 'created_by', 'updated_by'
    ]
};

export const sanitizeForTable = (tableName: string, item: any) => {
    const validFields = VALID_FIELDS[tableName];
    if (!validFields) return item;
    return Object.fromEntries(
        Object.entries(item).filter(([key]) => validFields.includes(key))
    );
};

const mapToFrontend = (data: any, table: string) => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(item => mapToFrontend(item, table));

    const mapa = MAPA_COLUNAS[table];
    const mapped: any = { ...data };
    
    // Fallback Helpers
    const safeArray = (val: any) => Array.isArray(val) ? val : [];
    const safeStr = (val: any) => typeof val === 'string' ? val : '';

    if (mapa) {
        Object.entries(mapa).forEach(([dbKey, feKey]) => {
            if (dbKey in mapped) {
                mapped[feKey] = mapped[dbKey];
                if (dbKey !== feKey) delete mapped[dbKey];
            }
        });
    }

    // JSONB Parsing with fallbacks
    if (table === 'clients') {
        mapped.links = safeArray(mapped.links);
        mapped.log_comunicacao = safeArray(mapped.log_comunicacao);
        mapped.assets = safeArray(mapped.assets);
        mapped.paleta_cores = safeArray(mapped.paleta_cores);
        mapped.fontes = safeArray(mapped.fontes);
        mapped.tom_de_voz = safeStr(mapped.tom_de_voz);
        mapped.metas = safeArray(mapped.metas);
    }

    if (table === 'tasks') {
        mapped.Checklist = safeArray(mapped.Checklist);
        mapped.Anexos = safeArray(mapped.Anexos);
        mapped.Comentarios = safeArray(mapped.Comentarios);
        mapped.Atividades = safeArray(mapped.Atividades);
    }

    if (table === 'checklists') {
        mapped.itens_levar = safeArray(mapped.itens_levar);
        mapped.itens_trazer = safeArray(mapped.itens_trazer);
        mapped.itens_gravar = safeArray(mapped.itens_gravar);
    }

    if (table === 'reunioes') {
        mapped.proximos_passos = safeArray(mapped.proximos_passos);
    }

    // Workspace specific mapping
    if (table === 'workspaces' && data.workspace_members) {
        mapped.membros_workspace = mapToFrontend(data.workspace_members, 'workspace_members');
        delete mapped.workspace_members;
    }

    if (table === 'workspace_members' && data.profiles) {
        mapped.perfis = data.profiles; 
        delete mapped.profiles;
    }
    
    return mapped;
};

const mapToDB = (data: any, table: string) => {
    if (!data) return data;
    const mapa = MAPA_COLUNAS[table];
    
    const mapped: any = { ...data };
    
    if (mapa) {
        Object.entries(mapa).forEach(([dbKey, feKey]) => {
            if (feKey in mapped) {
                mapped[dbKey] = mapped[feKey];
                if (dbKey !== feKey) {
                    delete mapped[feKey];
                }
            }
        });
    }

    // Ensure array fields for specific tables are never undefined
    if (table === 'tasks') {
        mapped.Checklist = mapped.Checklist || [];
        mapped.Anexos = mapped.Anexos || [];
        mapped.Comentarios = mapped.Comentarios || [];
        mapped.Atividades = mapped.Atividades || [];
    }
    
    if (table === 'checklists') {
        mapped.itens_levar = mapped.itens_levar || [];
        mapped.itens_trazer = mapped.itens_trazer || [];
        mapped.itens_gravar = mapped.itens_gravar || [];
    }

    if (table === 'whiteboards') {
        mapped.elements = mapped.elements || [];
        mapped.connections = mapped.connections || [];
    }

    if (table === 'clients') {
        mapped.links = mapped.links || [];
        mapped.log_comunicacao = mapped.log_comunicacao || [];
        mapped.assets = mapped.assets || [];
        mapped.paleta_cores = mapped.paleta_cores || [];
        mapped.fontes = mapped.fontes || [];
        mapped.tom_de_voz = mapped.tom_de_voz || '';
        mapped.metas = mapped.metas || [];
    }

    if (table === 'reunioes') {
        mapped.proximos_passos = mapped.proximos_passos || [];
    }

    return mapped;
};

export const DatabaseService = {
    // WORKSPACES
    async getMyWorkspaces(): Promise<Workspace[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: owned } = await supabase
            .from('workspaces')
            .select('*, workspace_members(role, user_id)')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

        const { data: memberships } = await supabase
            .from('workspace_members')
            .select('workspace_id, role, user_id')
            .eq('user_id', user.id);

        let memberWorkspaces: any[] = [];
        if (memberships && memberships.length > 0) {
            const workspaceIds = memberships.map(m => m.workspace_id);
            const { data: memberWs } = await supabase
                .from('workspaces')
                .select('*, workspace_members(role, user_id)')
                .in('id', workspaceIds)
                .neq('owner_id', user.id);

            if (memberWs) memberWorkspaces = memberWs;
        }

        const allWorkspaces = [...(owned || []), ...memberWorkspaces];
        const unique = Array.from(new Map(allWorkspaces.map(item => [item.id, item])).values());
        const frontendWorkspaces = mapToFrontend(unique, 'workspaces');

        return frontendWorkspaces.sort((a: any, b: any) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
    },

    async createWorkspace(name: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        let profileExists = false;
        for (let i = 0; i < 5; i++) {
            const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
            if (profile) { profileExists = true; break; }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!profileExists) {
            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
            });
        }

        const availableColors = ['bg-indigo-600', 'bg-blue-600', 'bg-emerald-600', 'bg-orange-500', 'bg-rose-600', 'bg-purple-600', 'bg-zinc-800'];
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];

        const { data, error } = await supabase
            .from('workspaces')
            .insert({ name, owner_id: user.id, color: randomColor })
            .select()
            .single();

        if (error) throw error;
        return mapToFrontend(data, 'workspaces');
    },

    async deleteWorkspace(id: string) {
        const { error } = await supabase.from('workspaces').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    async updateWorkspace(id: string, updates: any) {
        const dbUpdates = mapToDB(updates, 'workspaces');
        const { data, error } = await supabase.from('workspaces').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return mapToFrontend(data, 'workspaces');
    },

    async getWorkspaceMembers(workspaceId: string) {
        const { data, error } = await supabase
            .from('workspace_members')
            .select('*, profiles(full_name, email, avatar_url, role)')
            .eq('workspace_id', workspaceId);

        if (error) throw error;
        return mapToFrontend(data, 'workspace_members');
    },

    async getWorkspaceInvites(workspaceId: string) {
        const { data, error } = await supabase
            .from('invites')
            .select('*')
            .eq('workspace_id', workspaceId)
            .gt('expires_at', new Date().toISOString());

        if (error) throw error;
        return mapToFrontend(data, 'invites');
    },

    async createInvite(workspaceId: string, role: string = 'editor') {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('invites')
            .insert({
                workspace_id: workspaceId,
                token,
                role,
                created_by: user?.id,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return mapToFrontend(data, 'invites');
    },

    async acceptInvite(token: string) {
        const { data, error } = await supabase.rpc('accept_invite', { token_in: token });
        if (error) throw new Error(error.message || 'Erro ao aceitar convite.');
        return data?.workspace_id;
    },

    async removeMember(workspaceId: string, userId: string) {
        const { error } = await supabase.from('workspace_members').delete().eq('workspace_id', workspaceId).eq('user_id', userId);
        if (error) throw error;
        return true;
    },

    // DATA SYNC GENERIC
    async fetchData(table: string, workspaceId: string) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('workspace_id', workspaceId)
            .or('__archived.is.null,__archived.eq.false');

        if (error) return [];
        return mapToFrontend(data, table);
    },

    async syncItem(tableInput: string, item: any, workspaceId: string) {
        const table = tableInput.toLowerCase();
        if (!item.id) {
            console.error('[DatabaseService.syncItem] Blocked: Missing ID');
            return new Error('ID ausente');
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado no DatabaseService');
            const dbItem = mapToDB(item, table);

            const payload = {
                ...dbItem,
                workspace_id: workspaceId,
                updated_by: user?.id,
                updated_at: new Date().toISOString()
            };

            if (!payload.created_by && user) {
                payload.created_by = user.id;
            }

            const sanitized = sanitizeForTable(table, payload);
            console.log(`[DatabaseService.syncItem] PAYLOAD | Table: ${table}`, sanitized);
            const { data, error } = await supabase.from(table).upsert(sanitized, { onConflict: 'id' }).select();
            if (error) {
                let errorMessage = error.message;
                if (error.code === '42501') {
                    errorMessage = `Permissão negada (RLS). Verifique se você é um membro com papel de editor no Workspace ${workspaceId}.`;
                }
                console.error(`[DatabaseService.syncItem] SQL_ERROR | Table: ${table} | ID: ${item.id}`, {
                    message: errorMessage,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    payload: sanitized
                });
                return new Error(errorMessage);
            }
            console.log(`[DatabaseService.syncItem] SUCCESS | Table: ${table} | ID: ${item.id}`, data);
            
            if (!data || data.length === 0) {
                console.warn(`[DatabaseService.syncItem] NO_DATA_RETURNED | Table: ${table} | ID: ${item.id} | This often indicates an RLS Select policy failure.`);
                return new Error('Dados não retornados pelo servidor (possível falha de permissão de leitura).');
            }
            return null;
        } catch (err: any) {
            console.error(`[DatabaseService.syncItem] FATAL_ERROR | Table: ${table} | ID: ${item.id}`, err);
            return err;
        }
    },

    async updateItem(table: string, id: string, updates: any) {
        const { data: { user } } = await supabase.auth.getUser();
        const dbUpdates = mapToDB(updates, table);
        const payload = { 
            ...dbUpdates, 
            updated_by: user?.id,
            updated_at: new Date().toISOString() 
        };
        const sanitized = sanitizeForTable(table, payload);
        const { error } = await supabase.from(table).update(sanitized).eq('id', id);
        return error || null;
    },

    async deleteItem(table: string, id: string) {
        const { error } = await supabase.from(table).delete().eq('id', id);
        return error;
    },

    async fetchAllWorkspaceData(workspaceId: string) {
        const [clients, cobo, matriz, rdc, planning, financas, tasks, collaborators, checklists, retiradas, reunioes, lembretes] = await Promise.all([
            this.fetchData('clients', workspaceId),
            this.fetchData('cobo', workspaceId),
            this.fetchData('matriz_estrategica', workspaceId),
            this.fetchData('rdc', workspaceId),
            this.fetchData('planejamento', workspaceId),
            this.fetchData('financas', workspaceId),
            this.fetchData('tasks', workspaceId),
            this.fetchData('collaborators', workspaceId),
            this.fetchData('checklists', workspaceId),
            this.fetchData('retiradas_socios', workspaceId),
            this.fetchData('reunioes', workspaceId),
            this.fetchData('lembretes', workspaceId)
        ]);
        
        return { clients, cobo, matriz, rdc, planning, financas, tasks, collaborators, checklists, retiradas, reunioes, lembretes };
    },
    
    // RETIRADAS SOCIOS
    async fetchRetiradasSocios(workspaceId: string) {
        return this.fetchData('retiradas_socios', workspaceId);
    },

    async saveRetiradaSocio(data: any, workspaceId: string) {
        return this.syncItem('retiradas_socios', data, workspaceId);
    },

    async deleteRetiradaSocio(id: string) {
        return this.deleteItem('retiradas_socios', id);
    },

    // WHITEBOARD (Milanote)
    async getWhiteboard(workspaceId: string) {
        const { data, error } = await supabase
            .from('whiteboards')
            .select('*')
            .eq('workspace_id', workspaceId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows found"
        return data || null;
    },

    async saveWhiteboard(workspaceId: string, elements: any[], connections: any[], id?: string) {
        const payload: any = { 
            workspace_id: workspaceId, 
            elements, 
            connections, 
            updated_at: new Date().toISOString() 
        };
        if (id) payload.id = id;
        
        // As workspace_id is UNIQUE, we can upsert safely!
        const { data, error } = await supabase
            .from('whiteboards')
            .upsert(payload, { onConflict: 'workspace_id' })
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }
};
