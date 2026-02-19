
import React, { memo } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { logDebug } from '../DebugOverlay';

// SAFE MODE: No custom shapes, no custom UI, no custom logic.
// Just standard Tldraw to verify if the engine itself is stable in this environment.

export const WhiteboardSafeMode = memo(function WhiteboardSafeMode() {
    React.useEffect(() => {
        logDebug('WhiteboardSafeMode MOUNTED');
        return () => logDebug('WhiteboardSafeMode UNMOUNTED');
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000, background: 'red', color: 'white', padding: '4px' }}>
                SAFE MODE - VANILLA TLDRAW
            </div>
            <Tldraw
                persistenceKey="ekko-whiteboard-safe-v1"
                inferDarkMode={true}
            />
        </div>
    );
});
