
import React, { memo, useState, useLayoutEffect, useEffect, useRef } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { logDebug } from './DebugOverlay';

// SAFE MODE debugs:
// 1. Real-time Camera values
// 2. Exception catching

export const WhiteboardSafeMode = memo(function WhiteboardSafeMode() {
    const [seconds, setSeconds] = useState(0);
    const [mountKey, setMountKey] = useState(0); // For hard reset
    const [recoveryCount, setRecoveryCount] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [cameraDebug, setCameraDebug] = useState("init"); // DISPLAY CAMERA

    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);

    // Measure container size
    useLayoutEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setDimensions({ width, height });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Timer and Camera Monitor
    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds(s => s + 1);

            // Check Camera Health
            if (editorRef.current) {
                try {
                    const camera = editorRef.current.getCamera();
                    const stateStr = `x:${Math.round(camera.x)}, y:${Math.round(camera.y)}, z:${camera.z.toFixed(2)}`;
                    setCameraDebug(stateStr);

                    // AGGRESSIVE CHECKS
                    const isNaN = Number.isNaN(camera.x) || Number.isNaN(camera.y) || Number.isNaN(camera.z);
                    const isInf = !Number.isFinite(camera.x);
                    const isZeroZoom = camera.z === 0;

                    if (isNaN || isInf || isZeroZoom) {
                        logDebug(`CRITICAL CAMERA FAILURE: ${stateStr}. Auto-Remounting...`);
                        triggerRemount();
                    }

                } catch (e: any) {
                    logDebug(`CRITICAL EXCEPTION In Monitor: ${e.message}. Auto-Remounting...`);
                    triggerRemount();
                }
            } else {
                setCameraDebug("No Editor Ref");
            }
        }, 500); // Check every 500ms

        return () => clearInterval(timer);
    }, [mountKey]);

    const triggerRemount = () => {
        setRecoveryCount(c => c + 1);
        setMountKey(k => k + 1);
        setSeconds(0);
        editorRef.current = null;
    };

    const shouldRender = dimensions.width > 0 && dimensions.height > 0;

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', border: '5px solid blue', backgroundColor: '#222' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, background: 'blue', color: 'white', padding: '8px', fontSize: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>TIME: {seconds}s</span>
                <span style={{ color: 'yellow', fontWeight: 'bold' }}>RECOVERIES: {recoveryCount}</span>
                <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', fontFamily: 'monospace' }}>CAM: {cameraDebug}</span>

                <button onClick={() => {
                    if (editorRef.current) editorRef.current.setCamera({ x: 0, y: 0, z: 1 });
                }} style={{ background: 'white', color: 'blue', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>RESET CAM</button>

                <button onClick={triggerRemount} style={{ background: 'red', color: 'white', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>HARD REMOUNT</button>
            </div>

            {shouldRender ? (
                <Tldraw
                    key={mountKey}
                    persistenceKey="ekko-whiteboard-safe-v2"
                    inferDarkMode={true}
                    options={{ maxPages: 1 }}
                    onMount={(editor) => {
                        editorRef.current = editor;
                        logDebug('Tldraw Editor MOUNTED');
                    }}
                />
            ) : (
                <div style={{ color: 'red', padding: '20px' }}>Waiting for valid dimensions... ({dimensions.width}x{dimensions.height})</div>
            )}
        </div>
    );
});
