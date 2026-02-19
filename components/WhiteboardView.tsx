import React, { useCallback } from 'react';
import { Tldraw, TldrawFile } from 'tldraw';
import 'tldraw/tldraw.css';

interface WhiteboardViewProps {
    data?: any;
    onSave?: (snapshot: any) => void;
}

export function WhiteboardView({ data, onSave }: WhiteboardViewProps) {
    const handleMount = useCallback((editor: any) => {
        // Load initial data if present
        if (data) {
            editor.loadSnapshot(data);
        }

        // Setup auto-save listener (simplified)
        // In a real app, we might debounce this
        /*
        editor.store.listen((entry: any) => {
             // Logic to capture changes
        });
        */
    }, [data]);

    return (
        <div className="w-full h-[calc(100dvh-100px)] relative bg-[#111827]">
            {/* 
              Tldraw handles its own internal layout. 
              We wrap it to constrain it to our tab view. 
              'persistenceKey' helps tldraw save locally to localStorage for now.
            */}
            <Tldraw
                persistenceKey="ekko-whiteboard-mvp"
                onMount={handleMount}
            // We'll customize UI later
            // hideUi={true} 
            />
        </div>
    );
}
