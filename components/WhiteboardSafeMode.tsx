
import React, { memo } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { logDebug } from './DebugOverlay';

// SAFE MODE: No custom shapes, no custom UI, no custom logic.
// Just standard Tldraw to verify if the engine itself is stable in this environment.

export const WhiteboardSafeMode = memo(function WhiteboardSafeMode() {
    const [seconds, setSeconds] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        logDebug('WhiteboardSafeMode MOUNTED');

        const timer = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);

        // Monitor container size
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                console.log('[SafeMode] Resize:', width, height);
                if (width === 0 || height === 0) {
                    logDebug('WhiteboardSafeMode RESIZED TO 0', { width, height });
                }
            }
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            logDebug('WhiteboardSafeMode UNMOUNTED', { livedSeconds: seconds }); // Use ref for live seconds if needed, but this is fine for simple log
            clearInterval(timer);
            observer.disconnect();
        };
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', border: '5px solid blue' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000, background: 'blue', color: 'white', padding: '8px', fontSize: '18px' }}>
                SAFE MODE - TIME ALIVE: {seconds}s
            </div>
            <Tldraw
                persistenceKey={null} // NO PERSISTENCE
                inferDarkMode={true}
                options={{ maxPages: 1 }}
            />
        </div>
    );
});
