
import { toPng } from 'html-to-image';

export const captureSlide = async (elementId: string, fileName: string) => {
    const node = document.getElementById(elementId);
    if (!node) return;

    try {
        const dataUrl = await toPng(node, {
            quality: 1.0,
            pixelRatio: 2, // 2x for retina-like sharpness
            backgroundColor: '#0B0B0E' // Match app background
        });

        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('Failed to capture slide:', error);
    }
};
