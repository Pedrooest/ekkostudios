import React, { useMemo, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { logDebug } from './DebugOverlay';

interface WhiteboardViewProps {
    data?: any;
    onSave?: (snapshot: any) => void;
    tasks?: any[];
    clients?: any[];
    currentWorkspace?: any;
    onUpdateTask?: (taskId: string, data: any) => Promise<void>;
    onAddItem?: (type: string, payload?: any) => Promise<any>;
    currentUser?: any;
}

export const WhiteboardView = React.memo(function WhiteboardView({ data, onSave, tasks = [], clients = [], currentWorkspace, onUpdateTask, onAddItem, currentUser }: WhiteboardViewProps) {

    const contextValue = useMemo(() => ({
        tasks,
        clients,
        workspace: currentWorkspace,
        onUpdateTask: onUpdateTask || (async () => { }),
        onAddItem: onAddItem || (async () => { }),
    }), [tasks, clients, currentWorkspace, onUpdateTask, onAddItem]);

    return (
        <div
            className="w-full relative bg-[#111827] isolate overflow-hidden"
            style={{ height: 'calc(100vh - 100px)', minHeight: '600px', display: 'block' }}
        >
            <ErrorBoundary fallback={<div className="p-10 text-white">Whiteboard Error. Please refresh.</div>}>
                <WhiteboardCanvas
                    currentWorkspace={currentWorkspace}
                    currentUser={currentUser}
                    contextValue={contextValue}
                />
            </ErrorBoundary>
        </div>
    );
});
