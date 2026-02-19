import React, { useCallback } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import './whiteboard/whiteboard.css';
import { NoteShapeUtil } from './whiteboard/shapes/NoteShape';
import { TaskShapeUtil } from './whiteboard/shapes/TaskShape';
import { CommentShapeUtil } from './whiteboard/shapes/CommentShape';
import { WhiteboardToolbar } from './whiteboard/ui/WhiteboardToolbar';
import { WhiteboardInspector } from './whiteboard/ui/WhiteboardInspector';
import { WhiteboardProvider } from './whiteboard/WhiteboardContext';

import { WhiteboardTemplates } from './whiteboard/ui/WhiteboardTemplates';
import { useWhiteboardCollaboration } from './whiteboard/hooks/useWhiteboardCollaboration';
import { WhiteboardCursors } from './whiteboard/ui/WhiteboardCursors';

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

// Pass the classes (Constructors) directly
const customShapeUtils = [TaskShapeUtil, NoteShapeUtil, CommentShapeUtil]

export const WhiteboardView = React.memo(function WhiteboardView({ data, onSave, tasks = [], clients = [], currentWorkspace, onUpdateTask, onAddItem, currentUser }: WhiteboardViewProps) {
    const [isTemplatesOpen, setIsTemplatesOpen] = React.useState(false);

    // Collaboration
    const { peers } = useWhiteboardCollaboration(currentWorkspace?.id, currentUser);

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
                    persistenceKey="ekko-whiteboard-v5"
                    shapeUtils={customShapeUtils}
                    onMount={handleMount}
                    inferDarkMode={true}
                    options={{ maxPages: 1 }}
                    hideUi={true}
                >
                    <WhiteboardToolbar onToggleTemplates={() => setIsTemplatesOpen(!isTemplatesOpen)} />
                    <WhiteboardInspector />
                    <WhiteboardTemplates isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
                    <WhiteboardCursors peers={peers} />
                </Tldraw>
            </WhiteboardProvider>
        </div>
    );
});
