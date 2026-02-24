import { supabase } from './supabase';
import {
    Cliente, ItemCobo, ItemMatrizEstrategica, ItemRdc, ItemPlanejamento,
    LancamentoFinancas, Tarefa, Colaborador, VhConfig, DadosModelagemSistematica,
    Workspace, MembroWorkspace, Convite
} from './types';

// Mapeamento de nomes de colunas do Banco para nomes em Português nas Interfaces
const MAPA_COLUNAS: Record<string, Record<string, string>> = {
    workspaces: {
        owner_id: 'id_proprietario',
        created_at: 'criado_em'
    },
    workspace_members: {
        user_id: 'id_usuario',
        role: 'papel',
        joined_at: 'entrou_em'
    },
    invites: {
        workspace_id: 'id_workspace',
        expires_at: 'expira_em',
        role: 'papel'
    },
    tasks: {
        Checklist: 'Checklist',
        Anexos: 'Anexos',
        Comentarios: 'Comentarios',
        Activities: 'Atividades',
        created_at: 'Criado_Em',
        updated_at: 'Atualizado_Em'
    }
};

const mapToFrontend = (data: any, table: string) => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(item => mapToFrontend(item, table));

    const mapa = MAPA_COLUNAS[table];
    if (!mapa) return data;

    const mapped: any = { ...data };
    Object.entries(mapa).forEach(([dbKey, feKey]) => {
        if (dbKey in mapped) {
            mapped[feKey] = mapped[dbKey];
            delete mapped[dbKey];
        }
    });

    // Recursively map joined objects
    if (table === 'workspaces' && data.workspace_members) {
        mapped.membros_workspace = mapToFrontend(data.workspace_members, 'workspace_members');
        delete mapped.workspace_members;
    }
    if (table === 'workspace_members' && data.profiles) {
        mapped.perfis = data.profiles; // Profiles already match
        delete mapped.profiles;
    }

    return mapped;
};

const mapToDB = (data: any, table: string) => {
    if (!data) return data;
    const mapa = MAPA_COLUNAS[table];
    if (!mapa) return data;

    const mapped: any = { ...data };
    Object.entries(mapa).forEach(([dbKey, feKey]) => {
        if (feKey in mapped) {
            mapped[dbKey] = mapped[feKey];
            delete mapped[feKey];
        }
    });
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

    async syncItem(table: string, item: any, workspaceId: string) {
        if (!item.id) return new Error('ID ausente');

        const user = (await supabase.auth.getUser()).data.user;
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

        const { error } = await supabase.from(table).upsert(payload);
        return error || null;
    },

    async updateItem(table: string, id: string, updates: any) {
        const dbUpdates = mapToDB(updates, table);
        const { error } = await supabase.from(table).update({ ...dbUpdates, updated_at: new Date().toISOString() }).eq('id', id);
        return error || null;
    },

    async deleteItem(table: string, id: string) {
        const { error } = await supabase.from(table).delete().eq('id', id);
        return error;
    },

    async fetchAllWorkspaceData(workspaceId: string) {
        const [clients, cobo, matriz, rdc, planning, financas, tasks, collaborators] = await Promise.all([
            this.fetchData('clients', workspaceId),
            this.fetchData('cobo', workspaceId),
            this.fetchData('matriz_estrategica', workspaceId),
            this.fetchData('rdc', workspaceId),
            this.fetchData('planejamento', workspaceId),
            this.fetchData('financas', workspaceId),
            this.fetchData('tasks', workspaceId),
            this.fetchData('collaborators', workspaceId)
        ]);

        return { clients, cobo, matriz, rdc, planning, financas, tasks, collaborators };
    }
};
