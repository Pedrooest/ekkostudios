
import React, { memo, useState, useLayoutEffect, useEffect, useRef } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { logDebug } from './DebugOverlay';

// SAFE MODE: Vanilla Tldraw with NaN Guards and Camera Auto-Reset + AUTO REMOUNT

export const WhiteboardSafeMode = memo(function WhiteboardSafeMode() {
    const [seconds, setSeconds] = useState(0);
    const [mountKey, setMountKey] = useState(0); // For hard reset
    const [recoveryCount, setRecoveryCount] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);

    // Measure container size before rendering Tldraw
    useLayoutEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setDimensions({ width, height });
                if (width === 0 || height === 0) {
                    logDebug('SafeMode: Container has 0 dimensions!', { width, height });
                }
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Timer and Camera Monitor
    useEffect(() => {
        logDebug(`WhiteboardSafeMode MOUNTED (Key: ${mountKey})`);

        const timer = setInterval(() => {
            setSeconds(s => s + 1);

            // Check Camera Health
            if (editorRef.current) {
                try {
                    const camera = editorRef.current.getCamera();
                    // Check for NaN or Infinity
                    if (Number.isNaN(camera.x) || Number.isNaN(camera.y) || Number.isNaN(camera.z) || !Number.isFinite(camera.x)) {
                        logDebug('CRITICAL: Camera is NaN/Infinite! Triggering AUTO-REMOUNT...');
                        setRecoveryCount(c => c + 1);

                        // FORCE REMOUNT TO FIX RENDERER CRASH
                        setMountKey(k => k + 1);
                        setSeconds(0);
                        editorRef.current = null;
                    }
                } catch (e) {
                    // ignore
                }
            }
        }, 1000);

        return () => {
            logDebug('WhiteboardSafeMode UNMOUNTED', { livedSeconds: seconds });
            clearInterval(timer);
        };
    }, [mountKey]);

    const handleResetCamera = () => {
        if (editorRef.current) {
            try {
                editorRef.current.setCamera({ x: 0, y: 0, z: 1 });
                logDebug('Camera Hard Reset Triggered');
            } catch (e: any) {
                logDebug('Camera Reset FAILED', { error: e.message });
            }
        }
    };

    const handleForceRemount = () => {
        logDebug('Forcing Component Remount...');
        setMountKey(k => k + 1);
        setSeconds(0);
        editorRef.current = null;
    };

    // Only render Tldraw if dimensions are valid
    const shouldRender = dimensions.width > 0 && dimensions.height > 0;

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', border: '5px solid blue', backgroundColor: '#222' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000, background: 'blue', color: 'white', padding: '8px', fontSize: '14px', display: 'flex', gap: '10px' }}>
                <span>TIME: {seconds}s</span>
                <span style={{ color: 'yellow', fontWeight: 'bold' }}>RECOVERIES: {recoveryCount}</span>
                <button onClick={handleResetCamera} style={{ background: 'white', color: 'blue', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>RESET CAMERA</button>
                <button onClick={handleForceRemount} style={{ background: 'red', color: 'white', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>HARD REMOUNT</button>
            </div>

            {shouldRender ? (
                <Tldraw
                    key={mountKey} // Force remount on key change
                    persistenceKey="ekko-whiteboard-safe-v2" // RESTORED PERSISTENCE TO KEEP CONTENT
                    inferDarkMode={true}
                    options={{ maxPages: 1 }}
                    onMount={(editor) => {
                        editorRef.current = editor;
                        logDebug('Tldraw Editor MOUNTED (Ref Set)');
                    }}
                />
            ) : (
                <div style={{ color: 'red', padding: '20px' }}>Waiting for valid dimensions... ({dimensions.width}x{dimensions.height})</div>
            )}
        </div>
    );
});
