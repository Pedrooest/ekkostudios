import React, { useCallback } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import './whiteboard/whiteboard.css';
import { NoteShapeUtil } from './whiteboard/shapes/NoteShape';
import { TaskShapeUtil } from './whiteboard/shapes/TaskShape';

interface WhiteboardViewProps {
    data?: any;
    onSave?: (snapshot: any) => void;
}

// Pass the classes (Constructors) directly
const customShapeUtils = [TaskShapeUtil, NoteShapeUtil]

export const WhiteboardView = React.memo(function WhiteboardView({ data, onSave }: WhiteboardViewProps) {
    const handleMount = useCallback((editor: any) => {
        if (data) editor.loadSnapshot(data);
    }, [data]);

    return (
        <div className="w-full h-[calc(100dvh-100px)] relative bg-[#111827] isolate overflow-hidden">
            <Tldraw
                persistenceKey="ekko-whiteboard-v4"
                shapeUtils={customShapeUtils}
                onMount={handleMount}
                inferDarkMode={true}
                options={{ maxPages: 1 }}
            // Hide default UI to use our custom toolbar later
            // hideUi={true} 
            />
        </div>
    );
});
