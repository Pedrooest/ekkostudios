import React from 'react';
import { useEditor } from 'tldraw';
import { useWhiteboardCollaboration } from '../hooks/useWhiteboardCollaboration';

export const WhiteboardCursors = ({ workspaceId, user }: { workspaceId: string, user: any }) => {
    const editor = useEditor();
    const { peers } = useWhiteboardCollaboration(workspaceId, user);

    if (!editor) return null;

    // We rely on useEditor for coordinate transform, so we need to be careful about rerenders.
    // However, for cursors, we might want to just map directly if possible.
    // But pageToViewport is needed.
    // The issue is that `editor` reference might be stable but viewport changes.
    // We should probably use `useValue` or just let React handle it via state/effect, but here we are mapping peers directly.
    // Note: useWhiteboardCollaboration updates `peers` state, which triggers rerender here.

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[500]">
            {Object.values(peers).map(peer => {
                const screen = editor.pageToViewport({ x: peer.x, y: peer.y });

                return (
                    <div
                        key={peer.id}
                        className="absolute transition-all duration-100 ease-linear flex flex-col items-start gap-1"
                        style={{
                            transform: `translate(${screen.x}px, ${screen.y}px)`,
                            opacity: 0.8
                        }}
                    >
                        <i className={`fa-solid fa-location-arrow text-lg -rotate-45`} style={{ color: peer.color }}></i>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-sm" style={{ backgroundColor: peer.color }}>
                            {peer.name}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
