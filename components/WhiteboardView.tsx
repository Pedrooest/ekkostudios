import React, { useCallback } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import './whiteboard/whiteboard.css';
import { NoteShapeUtil } from './whiteboard/shapes/NoteShape';
import { TaskShapeUtil } from './whiteboard/shapes/TaskShape';
import { WhiteboardToolbar } from './whiteboard/ui/WhiteboardToolbar';
import { WhiteboardInspector } from './whiteboard/ui/WhiteboardInspector';
import { WhiteboardProvider } from './whiteboard/WhiteboardContext';

interface WhiteboardViewProps {
    data?: any;
    onSave?: (snapshot: any) => void;
    tasks?: any[];
    clients?: any[];
    currentWorkspace?: any;
}

// Pass the classes (Constructors) directly
const customShapeUtils = [TaskShapeUtil, NoteShapeUtil]

export const WhiteboardView = React.memo(function WhiteboardView({ data, onSave, tasks = [], clients = [], currentWorkspace }: WhiteboardViewProps) {
    const handleMount = useCallback((editor: any) => {
        if (data) editor.loadSnapshot(data);
    }, [data]);

    const contextValue = {
        tasks,
        clients,
        workspace: currentWorkspace,
        onUpdateTask: async () => { },
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
                    <WhiteboardToolbar />
                    <WhiteboardInspector />
                </Tldraw>
            </WhiteboardProvider>
        </div>
    );
});
