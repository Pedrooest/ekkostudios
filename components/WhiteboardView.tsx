import React, { useCallback } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import './whiteboard/whiteboard.css';
import { NoteShapeUtil } from './whiteboard/shapes/NoteShape';
import { TaskShapeUtil } from './whiteboard/shapes/TaskShape';
import { WhiteboardToolbar } from './whiteboard/ui/WhiteboardToolbar';
import { WhiteboardInspector } from './whiteboard/ui/WhiteboardInspector';
import { WhiteboardProvider } from './whiteboard/WhiteboardContext';

import { WhiteboardTemplates } from './whiteboard/ui/WhiteboardTemplates';
import { MiniMap } from 'tldraw';

interface WhiteboardViewProps {
    data?: any;
    onSave?: (snapshot: any) => void;
    tasks?: any[];
    clients?: any[];
    currentWorkspace?: any;
    onUpdateTask?: (taskId: string, data: any) => Promise<void>;
    onAddItem?: (type: string, payload?: any) => Promise<void>;
}

// Pass the classes (Constructors) directly
const customShapeUtils = [TaskShapeUtil, NoteShapeUtil]

export const WhiteboardView = React.memo(function WhiteboardView({ data, onSave, tasks = [], clients = [], currentWorkspace, onUpdateTask, onAddItem }: WhiteboardViewProps) {
    const [isTemplatesOpen, setIsTemplatesOpen] = React.useState(false);

    const handleMount = useCallback((editor: any) => {
        if (data) editor.loadSnapshot(data);
    }, [data]);

    const contextValue = {
        tasks,
        clients,
        workspace: currentWorkspace,
        onUpdateTask: onUpdateTask || (async () => { }),
        onAddItem: onAddItem || (async () => { }),
    };

    return (
        <div className="w-full h-[calc(100dvh-100px)] relative bg-[#111827] isolate overflow-hidden">
            <WhiteboardProvider data={contextValue}>
                <Tldraw
                    persistenceKey="ekko-whiteboard-v4"
                    shapeUtils={customShapeUtils}
                    onMount={handleMount}
                    inferDarkMode={true}
                    options={{ maxPages: 1 }}
                    hideUi={true}
                >
                    <WhiteboardToolbar onToggleTemplates={() => setIsTemplatesOpen(!isTemplatesOpen)} />
                    <WhiteboardInspector />
                    <WhiteboardTemplates isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
                    <div className="absolute bottom-4 right-4 z-[500] pointer-events-auto">
                        <MiniMap />
                    </div>
                </Tldraw>
            </WhiteboardProvider>
        </div>
    );
});
