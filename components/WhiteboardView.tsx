import React, { useCallback, useRef, useState } from 'react';
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
import { WhiteboardCursors } from './whiteboard/ui/WhiteboardCursors';
import { WhiteboardAIModal } from './whiteboard/ui/WhiteboardAIModal';
import { generateBrainstormingIdeas } from '../geminiService';

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
    const [isAIOpen, setIsAIOpen] = React.useState(false);

    // Note: Collaboration hook moved to WhiteboardCursors to access Tldraw context safely
    const editorRef = useRef<any>(null);

    const onEditorMount = useCallback((editor: any) => {
        editorRef.current = editor;
        if (data) editor.loadSnapshot(data);
    }, [data]);

    const handleAIGenerate = async (prompt: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        const ideas = await generateBrainstormingIdeas(prompt);

        if (!ideas || ideas.length === 0) return;

        const center = editor.getViewportPageBounds().center;
        const shapes: any[] = [];

        // Arrange in a grid or stack
        ideas.forEach((idea, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const offsetX = (col * 220) - 220;
            const offsetY = (row * 220) - 100;

            // Random rotation for organic feel
            const rotation = (Math.random() * 0.1) - 0.05;

            shapes.push({
                type: 'note',
                x: center.x + offsetX,
                y: center.y + offsetY,
                rotation,
                props: {
                    text: idea,
                    color: ['yellow', 'blue', 'green', 'red', 'purple'][index % 5]
                }
            });
        });

        editor.createShapes(shapes);
    };

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
                    onMount={onEditorMount}
                    inferDarkMode={true}
                    options={{ maxPages: 1 }}
                    hideUi={true}
                >
                    <WhiteboardToolbar onToggleTemplates={() => setIsTemplatesOpen(!isTemplatesOpen)} onToggleAI={() => setIsAIOpen(true)} />
                    <WhiteboardInspector />
                    <WhiteboardTemplates isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
                    <WhiteboardCursors workspaceId={currentWorkspace?.id} user={currentUser} />
                    <WhiteboardAIModal
                        isOpen={isAIOpen}
                        onClose={() => setIsAIOpen(false)}
                        onGenerate={handleAIGenerate}
                    />
                </Tldraw>
            </WhiteboardProvider>
        </div>
    );
});
