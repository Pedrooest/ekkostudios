
import React, { useState, useEffect } from 'react';

const LOG_EVENT_NAME = 'ekko-debug-log';

export const logDebug = (message: string, data?: any) => {
    const event = new CustomEvent(LOG_EVENT_NAME, {
        detail: { message, data, timestamp: new Date().toISOString() }
    });
    window.dispatchEvent(event);
    console.log(`[DEBUG] ${message}`, data || '');
};

export const DebugOverlay = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handler = (e: any) => {
            setLogs(prev => [e.detail, ...prev].slice(0, 20)); // Keep last 20
        };

        window.addEventListener(LOG_EVENT_NAME, handler);
        return () => window.removeEventListener(LOG_EVENT_NAME, handler);
    }, []);

    if (!isVisible) return <button onClick={() => setIsVisible(true)} className="fixed top-0 left-1/2 bg-red-500 text-white p-2 z-[9999]">Show Debug</button>;

    return (
        <div className="fixed top-0 left-0 w-full h-[200px] bg-black/80 text-green-400 font-mono text-xs z-[9999] pointer-events-none p-4 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-green-900 pb-2 mb-2 pointer-events-auto">
                <h3 className="font-bold">SYSTEM DEBUGGER</h3>
                <div className="flex gap-4">
                    <button onClick={() => setLogs([])}>CLEAR</button>
                    <button onClick={() => setIsVisible(false)}>HIDE</button>
                </div>
            </div>
            {logs.map((log, i) => (
                <div key={i} className="mb-1 border-b border-white/10 pb-1">
                    <span className="text-gray-500">[{log.timestamp.split('T')[1].split('.')[0]}]</span>{' '}
                    <span className="font-bold text-white">{log.message}</span>{' '}
                    <span className="text-gray-400">{JSON.stringify(log.data)}</span>
                </div>
            ))}
        </div>
    );
};
