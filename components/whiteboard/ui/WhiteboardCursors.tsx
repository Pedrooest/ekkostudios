import React from 'react';
import { useEditor } from 'tldraw';

interface Peer {
    id: string;
    x: number;
    y: number;
    name: string;
    color: string;
    lastUpdated: number;
}

export const WhiteboardCursors = ({ peers }: { peers: Record<string, Peer> }) => {
    const editor = useEditor();

    // We need to transform page coordinates to screen coordinates
    // Actually, sticking to page coordinates and transforming CSS is better if we are inside the canvas container?
    // But tldraw canvas moves. 
    // Best is to use editor.viewportPageBounds to project or just render absolute in a container that moves?
    // Simpler: Render fixed on screen, but calculate screen pos from page pos.

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
                        <i className="fa-solid fa-location-arrow text-lg -rotate-45" style={{ color: peer.color }}></i>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap" style={{ backgroundColor: peer.color }}>
                            {peer.name}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
