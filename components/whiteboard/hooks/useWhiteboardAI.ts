import { useState, useCallback } from 'react';
import { Editor, createShapeId, toRichText } from 'tldraw';
import { generateBrainstormingIdeas } from '../../../geminiService';

export function useWhiteboardAI(editor: Editor) {
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const openAI = useCallback(() => setIsAIModalOpen(true), []);
    const closeAI = useCallback(() => setIsAIModalOpen(false), []);

    const generateIdeas = useCallback(async (prompt: string) => {
        if (!prompt.trim()) return;

        setIsLoading(true);
        try {
            console.log('[WhiteboardAI] Requesting ideas for:', prompt);
            let ideas: string[] = [];

            try {
                ideas = await generateBrainstormingIdeas(prompt);
                console.log('[WhiteboardAI] Received ideas:', ideas);
            } catch (err: any) {
                console.error('[WhiteboardAI] Service call failed:', err);
                alert(`API Error: ${err.message || err}`);
            }

            // LOCAL FALLBACK if Service returned empty/failed
            if (!ideas || ideas.length === 0) {
                console.warn('[WhiteboardAI] Using Local Fallback ideas');
                ideas = ["Ideia 1 (Offline)", "Ideia 2 (Offline)", "Ideia 3 (Offline)"];
            }

            if (ideas.length > 0) {
                try {
                    // Get center of viewport
                    const viewport = editor.getViewportPageBounds();
                    const centerX = viewport.x + viewport.width / 2;
                    const centerY = viewport.y + viewport.height / 2;

                    // Create sticky notes using strict Tldraw 4.4.0 schema (via richText)
                    const shapes = ideas.map((idea, index) => {
                        const col = index % 3;
                        const row = Math.floor(index / 3);
                        const offsetX = (col - 1) * 220;
                        const offsetY = (row - 1) * 220;

                        return {
                            id: createShapeId(),
                            type: 'note',
                            x: centerX + offsetX,
                            y: centerY + offsetY,
                            props: {
                                richText: toRichText(idea),
                                color: 'yellow',
                            }
                        };
                    });

                    console.log('[WhiteboardAI] Creating shapes:', shapes);
                    editor.createShapes(shapes);
                    editor.zoomToFit();
                } catch (shapeError) {
                    console.error('[WhiteboardAI] Shape Creation Failed:', shapeError);
                    alert('Erro ao criar formas no quadro: ' + shapeError);
                }
            }
        } catch (error) {
            console.error('Fatal AI Error:', error);
            alert('Erro fatal no módulo IA.');
        } finally {
            setIsLoading(false);
            setIsAIModalOpen(false);
        }
    }, [editor]);

    return {
        isAIModalOpen,
        isLoading,
        openAI,
        closeAI,
        generateIdeas
    };
}
