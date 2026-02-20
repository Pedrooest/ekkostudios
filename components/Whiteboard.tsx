
import React, { memo, useEffect } from 'react';
import { Tldraw, useEditor } from 'tldraw';
import 'tldraw/tldraw.css';
import { WhiteboardToolbar } from './whiteboard/ui/WhiteboardToolbar';
import { useWhiteboardAI } from './whiteboard/hooks/useWhiteboardAI';
import { WhiteboardAIModal } from './whiteboard/ui/WhiteboardAIModal';

// Phase 39: Clean Rebuild
// Goal: A stable, minimal Whiteboard component.
// No custom shapes, no complex context logic initially.

// Internal component to access Tldraw Context (useEditor)
const WhiteboardInternal = () => {
    const editor = useEditor();
    const { isAIModalOpen, isLoading, openAI, closeAI, generateIdeas } = useWhiteboardAI(editor);

    return (
        <>
            <WhiteboardToolbar
                onToggleAI={openAI}
                onToggleTemplates={() => alert('Modelos em breve!')}
            />
            <WhiteboardAIModal
                isOpen={isAIModalOpen}
                isLoading={isLoading}
                onClose={closeAI}
                onGenerate={generateIdeas}
            />
        </>
    );
};

export const Whiteboard = memo(function Whiteboard() {

    useEffect(() => {
        console.log('[Whiteboard] Clean Rebuild MOUNTED');
        return () => console.log('[Whiteboard] Clean Rebuild UNMOUNTED');
    }, []);

    return (
        <div
            className="w-full h-full relative"
            style={{
                height: 'calc(100vh - 84px)',
                isolation: 'isolate',
                backgroundColor: '#111827'
            }}
        >
            <Tldraw
                persistenceKey="EKKO_WB_FRESH_V1"
                inferDarkMode={true}
                options={{ maxPages: 1 }}
                hideUi={true} // Hide default toolbar to use custom one
            >
                <WhiteboardInternal />
            </Tldraw>
        </div>
    );
});
