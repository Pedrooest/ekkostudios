// ==========================================
// MOTOR DE ÁUDIO GLOBAL (Padrão iOS)
// ==========================================
let audioCtx: AudioContext | null = null;

export const initAudio = () => {
    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {
        console.warn("Áudio não suportado no navegador.");
    }
};

export const playUISound = (type: 'tap' | 'open' | 'close' | 'success') => {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    try {
        const playTone = (freq: number, waveType: OscillatorType, duration: number, vol = 0.1, slideFreq: number | null = null) => {
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = waveType;
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            if (slideFreq) {
                osc.frequency.exponentialRampToValueAtTime(slideFreq, audioCtx.currentTime + duration);
            }

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        };

        // Efeitos Sonoros
        if (type === 'tap') playTone(600, 'sine', 0.05, 0.05, 400); // Clique normal
        if (type === 'open') { // Abrir menu/modal
            playTone(300, 'sine', 0.1, 0.03, 600);
            setTimeout(() => playTone(600, 'sine', 0.15, 0.04), 40);
        }
        if (type === 'close') { // Fechar menu/modal
            playTone(600, 'sine', 0.1, 0.03, 300);
        }
        if (type === 'success') { // Efeito de sucesso (ex: Gerar Link)
            playTone(500, 'sine', 0.1, 0.05);
            setTimeout(() => playTone(1000, 'sine', 0.3, 0.05), 100);
        }
    } catch (e) { }
};
