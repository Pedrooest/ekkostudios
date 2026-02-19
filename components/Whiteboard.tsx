
import React, { memo, useEffect } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

// Phase 39: Clean Rebuild
// Goal: A stable, minimal Whiteboard component.
// No custom shapes, no complex context logic initially.

export const Whiteboard = memo(function Whiteboard() {

    useEffect(() => {
        console.log('[Whiteboard] Clean Rebuild MOUNTED');
        return () => console.log('[Whiteboard] Clean Rebuild UNMOUNTED');
    }, []);

    return (
        <div
            className="w-full h-full relative"
            style={{
                height: 'calc(100vh - 84px)', // Exact calculation based on App header
                isolation: 'isolate',
                backgroundColor: '#111827'
            }}
        >
            <Tldraw
                persistenceKey="ekko-whiteboard-clean-v1"
                inferDarkMode={true}
                options={{ maxPages: 1 }}
            />
        </div>
    );
});
