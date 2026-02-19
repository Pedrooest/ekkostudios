import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../supabase';
import { useEditor } from 'tldraw';

interface Peer {
    id: string;
    x: number;
    y: number;
    name: string;
    color: string;
    lastUpdated: number;
}

export function useWhiteboardCollaboration(workspaceId: string, user: any) {
    const editor = useEditor();
    const [peers, setPeers] = useState<Record<string, Peer>>({});
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!workspaceId || !user) return;

        const channelId = `whiteboard:${workspaceId}`;
        const channel = supabase.channel(channelId);

        channel
            .on('broadcast', { event: 'cursor' }, ({ payload }) => {
                if (payload.id === user.id) return; // Ignore self
                setPeers(prev => ({
                    ...prev,
                    [payload.id]: { ...payload, lastUpdated: Date.now() }
                }));
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log('Connected to Whiteboard Collaboration');
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [workspaceId, user]);

    // Cleanup stale peers
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setPeers(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(key => {
                    if (now - next[key].lastUpdated > 5000) { // 5 seconds timeout
                        delete next[key];
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Broadcast my cursor
    useEffect(() => {
        if (!editor || !channelRef.current) return;

        let rAF: number;
        let lastBroadcast = 0;

        const loop = () => {
            const now = Date.now();
            if (now - lastBroadcast > 50) { // Broadcast every 50ms
                try {
                    if (editor && editor.inputs && editor.inputs.currentPagePoint) {
                        const { x, y } = editor.inputs.currentPagePoint;

                        // Only send if inside bounds/valid (optional check)
                        if (user && user.id) {
                            channelRef.current.send({
                                type: 'broadcast',
                                event: 'cursor',
                                payload: {
                                    id: user.id,
                                    name: user.email?.split('@')[0] || 'User',
                                    color: user.color || '#3B82F6',
                                    x,
                                    y
                                }
                            });
                            lastBroadcast = now;
                        }
                    }
                } catch (e) {
                    // Silently fail or log sparingly to avoid spam
                }
            }
            rAF = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            cancelAnimationFrame(rAF);
        };
    }, [editor, user]);

    return { peers };
}
