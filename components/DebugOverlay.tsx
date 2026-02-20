
import React, { useState, useEffect } from 'react';

const LOG_EVENT_NAME = 'ekko-debug-log';

export const logDebug = (message: string, data?: any) => {
    const event = new CustomEvent(LOG_EVENT_NAME, {
        detail: { message, data, timestamp: new Date().toISOString() }
    });
    window.dispatchEvent(event);
    console.log(`[DEBUG] ${message}`, data || '');
};

export const DebugOverlay = () => {
    return null;
};
