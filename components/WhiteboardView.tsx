import React, { useCallback } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

interface WhiteboardViewProps {
    data?: any;
    onSave?: (snapshot: any) => void;
}

export const WhiteboardView = React.memo(function WhiteboardView({ data, onSave }: WhiteboardViewProps) {
    const handleMount = useCallback((editor: any) => {
        // Only load snapshot if explicit data is passed, overriding persistence
        if (data) {
            editor.loadSnapshot(data);
        }
    }, [data]);

    return (
        <div className="w-full h-[calc(100dvh-100px)] relative bg-[#111827] isolate overflow-hidden">
            {/* 
              Tldraw wrapper with 'isolate' to create a new stacking context 
              and prevent z-index conflicts with the main app.
            */}
            <Tldraw
                persistenceKey="ekko-whiteboard-v3"
                onMount={handleMount}
                inferDarkMode={true}
                options={{
                    maxPages: 1,
                }}
            />
        </div>
    );
});
