
import React, { memo } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { logDebug } from './DebugOverlay';

// SAFE MODE: No custom shapes, no custom UI, no custom logic.
// Just standard Tldraw to verify if the engine itself is stable in this environment.

export const WhiteboardSafeMode = memo(function WhiteboardSafeMode() {
    const [seconds, setSeconds] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const editorRef = React.useRef<any>(null);

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
            logDebug('WhiteboardSafeMode UNMOUNTED', { livedSeconds: seconds });
            clearInterval(timer);
            observer.disconnect();
        };
    }, []);

    const handleResetCamera = () => {
        if (editorRef.current) {
            try {
                editorRef.current.zoomToFit();
                logDebug('Camera Reset Triggered');
            } catch (e: any) {
                logDebug('Camera Reset FAILED', { error: e.message });
            }
        } else {
            logDebug('Editor Ref is NULL during Reset');
        }
    };

    const handleLogState = () => {
        if (editorRef.current) {
            try {
                const camera = editorRef.current.getCamera();
                const bounds = editorRef.current.getCurrentPageBounds();
                const shapes = editorRef.current.getCurrentPageShapes().length;
                logDebug('Editor State', { camera, bounds, shapeCount: shapes });
            } catch (e: any) {
                logDebug('Log State FAILED', { error: e.message });
            }
        } else {
            logDebug('Editor Ref is NULL during Log');
        }
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', border: '5px solid blue', backgroundColor: '#222' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000, background: 'blue', color: 'white', padding: '8px', fontSize: '14px', display: 'flex', gap: '10px' }}>
                <span>TIME: {seconds}s</span>
                <button onClick={handleResetCamera} style={{ background: 'white', color: 'blue', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>RESET CAMERA</button>
                <button onClick={handleLogState} style={{ background: 'white', color: 'blue', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>LOG STATE</button>
            </div>
            <Tldraw
                persistenceKey={null} // NO PERSISTENCE
                inferDarkMode={true}
                options={{ maxPages: 1 }}
                onMount={(editor) => {
                    editorRef.current = editor;
                    logDebug('Tldraw Editor MOUNTED (Ref Set)');
                }}
            />
        </div>
    );
});
