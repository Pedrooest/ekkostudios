
import React, { memo, useCallback, useRef, useState, useEffect } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import './whiteboard/whiteboard.css';
import { NoteShapeUtil } from './whiteboard/shapes/NoteShape';
import { TaskShapeUtil } from './whiteboard/shapes/TaskShape';
import { CommentShapeUtil } from './whiteboard/shapes/CommentShape';
import { WhiteboardToolbar } from './whiteboard/ui/WhiteboardToolbar';
import { WhiteboardInspector } from './whiteboard/ui/WhiteboardInspector';
import { WhiteboardTemplates } from './whiteboard/ui/WhiteboardTemplates';
import { WhiteboardCursors } from './whiteboard/ui/WhiteboardCursors';
import { WhiteboardAIModal } from './whiteboard/ui/WhiteboardAIModal';
import { generateBrainstormingIdeas } from '../geminiService';
import { ErrorBoundary } from './ErrorBoundary';
import { WhiteboardProvider } from './whiteboard/WhiteboardContext';
import { logDebug } from './DebugOverlay';

interface WhiteboardCanvasProps {
    currentWorkspace: any;
    currentUser: any;
    contextValue: any;
}

const customShapeUtils = [TaskShapeUtil, NoteShapeUtil, CommentShapeUtil];

// Memoized Canvas Component
export const WhiteboardCanvas = memo(function WhiteboardCanvas({ currentWorkspace, currentUser, contextValue }: WhiteboardCanvasProps) {
    console.log('[WhiteboardCanvas] Rendering', { workspaceId: currentWorkspace?.id, userId: currentUser?.id });

    React.useEffect(() => {
        logDebug('WhiteboardCanvas MOUNTED');
        return () => logDebug('WhiteboardCanvas UNMOUNTED');
    }, []);

    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const editorRef = useRef<any>(null);

    const onEditorMount = useCallback((editor: any) => {
        console.log('[WhiteboardCanvas] Editor mounted');
        editorRef.current = editor;
        // No snapshot loading logic here if data is always null, Tldraw handles persistence
    }, []);

    const handleAIGenerate = async (prompt: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        const ideas = await generateBrainstormingIdeas(prompt);

        if (!ideas || ideas.length === 0) return;

        const center = editor.getViewportPageBounds().center;
        const shapes: any[] = [];

        ideas.forEach((idea, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const offsetX = (col * 220) - 220;
            const offsetY = (row * 220) - 100;
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

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <WhiteboardProvider data={contextValue}>
                <Tldraw
                    persistenceKey="ekko-whiteboard-debug-v1"
                    shapeUtils={customShapeUtils}
                    onMount={onEditorMount}
                    inferDarkMode={true}
                    options={{ maxPages: 1 }}
                    hideUi={true}
                >
                    <WhiteboardToolbar onToggleTemplates={() => setIsTemplatesOpen(!isTemplatesOpen)} onToggleAI={() => setIsAIOpen(true)} />
                    <WhiteboardInspector />
                    <WhiteboardTemplates isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />

                    <ErrorBoundary>
                        <WhiteboardCursors workspaceId={currentWorkspace?.id} user={currentUser} />
                    </ErrorBoundary>

                    <WhiteboardAIModal
                        isOpen={isAIOpen}
                        onClose={() => setIsAIOpen(false)}
                        onGenerate={handleAIGenerate}
                    />
                </Tldraw>
            </WhiteboardProvider>
        </div>
    );
}, (prevProps, nextProps) => {
    // FORCE NO RE-RENDER for debugging
    // This effectively disconnects the whiteboard from live App data updates (tasks, clients)
    // but ensures the board never unmounts/resets due to parent re-renders.
    return true;
});
