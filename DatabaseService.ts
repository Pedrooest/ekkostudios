import { supabase } from './supabase';
import {
    Client, CoboItem, MatrizEstrategicaItem, RdcItem, PlanejamentoItem,
    FinancasLancamento, Task, Collaborator, VhConfig, SystematicModelingData,
    Workspace, WorkspaceMember, Invite
} from './types';

export const DatabaseService = {
    // WORKSPACES
    async getMyWorkspaces() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('workspaces')
            .select('*, workspace_members(role, user_id)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching workspaces:', error);
            return [];
        }
        return data;
    },

    async createWorkspace(name: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('workspaces')
            .insert({ name, owner_id: user.id })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteWorkspace(id: string) {
        const { error } = await supabase
            .from('workspaces')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async getWorkspaceMembers(elementId: string) {
        const { data, error } = await supabase
            .from('workspace_members')
            .select('*, profiles(full_name, email, avatar_url, role)')
            .eq('workspace_id', elementId);

        if (error) throw error;
        return data;
    },

    // INVITES
    async getWorkspaceInvites(workspaceId: string) {
        const { data, error } = await supabase
            .from('invites')
            .select('*')
            .eq('workspace_id', workspaceId)
            .gt('expires_at', new Date().toISOString());

        if (error) throw error;
        return data;
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
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async acceptInvite(token: string) {
        const { data: invite, error: fetchError } = await supabase
            .from('invites')
            .select('*')
            .eq('token', token)
            .single();

        if (fetchError || !invite) throw new Error('Convite inválido ou expirado.');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Faça login para aceitar o convite.');

        // Add to members
        const { error: joinError } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: invite.workspace_id,
                user_id: user.id,
                role: invite.role
            });

        if (joinError) {
            // Ignore if already member
            if (!joinError.message.includes('duplicate key')) throw joinError;
        }

        // Delete invite (optional, or keep for history)
        // await supabase.from('invites').delete().eq('id', invite.id);

        return invite.workspace_id;
    },

    async removeMember(workspaceId: string, userId: string) {
        const { error } = await supabase
            .from('workspace_members')
            .delete()
            .eq('workspace_id', workspaceId)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    },

    // DATA SYNC GENERIC
    async fetchData(table: string, workspaceId: string) {
        console.log(`[EKKO-SYNC] FETCHING ${table} FOR WS: ${workspaceId}`);
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('workspace_id', workspaceId)
            .or('__archived.is.null,__archived.eq.false'); // Handle potential nulls

        if (error) {
            console.error(`[EKKO-SYNC] FETCH ERROR ${table}:`, error);
            return [];
        }
        console.log(`[EKKO-SYNC] FETCHED ${data?.length || 0} ITEMS FROM ${table}`);
        return data;
    },

    async syncItem(table: string, item: any, workspaceId: string) {
        if (!item.id) {
            console.error(`[EKKO-SYNC] SYNC_ERROR: Item missing ID in ${table}`);
            return new Error('Missing ID');
        }

        const user = (await supabase.auth.getUser()).data.user;
        const payload = {
            ...item,
            workspace_id: workspaceId,
            updated_by: user?.id,
            updated_at: new Date().toISOString()
        };

        if (!payload.created_by && user) {
            payload.created_by = user.id;
        }

        console.log(`[EKKO-SYNC] SYNCING ${table} | ID: ${item.id}`, payload);

        const { error } = await supabase
            .from(table)
            .upsert(payload);

        if (error) {
            console.error(`[EKKO-SYNC] SYNC ERROR ${table}:`, error);
            return error;
        }

        console.log(`[EKKO-SYNC] SYNC SUCCESS ${table} | ID: ${item.id}`);
        return null;
    },

    async updateItem(table: string, id: string, updates: any) {
        console.log(`[EKKO-SYNC] UPDATING ${table} | ID: ${id}`, updates);
        const { error } = await supabase
            .from(table)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error(`[EKKO-SYNC] UPDATE ERROR ${table}:`, error);
            return error;
        }

        console.log(`[EKKO-SYNC] UPDATE SUCCESS ${table} | ID: ${id}`);
        return null;
    },

    async deleteItem(table: string, id: string) {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) console.error(`Error deleting from ${table}:`, error);
        return error;
    },

    // SPECIFIC DATA FETCHERS (Typed)
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
