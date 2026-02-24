
export const generateId = () => {
    try {
        return window.crypto.randomUUID();
    } catch (e) {
        // Fallback for non-secure contexts if any
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
