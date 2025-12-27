
import timerSoundPath from "../assets/audios/correct-356013.mp3";

// Web Audio API Context
let audioContext = null;
let audioBuffer = null;

// Global audio state
// Default to false (muted) until enabled by user, or read from storage
let isAudioOn = localStorage.getItem("ticktask_audio_enabled") === "true";

export const setAudioEnabled = (enabled) => {
  isAudioOn = enabled;
  localStorage.setItem("ticktask_audio_enabled", String(enabled));
  
  // consistency check: stop keepalive if disabled
  if (!enabled) {
    stopKeepAlive();
  }
};

export const getAudioEnabled = () => {
  return isAudioOn;
};

const initAudioContext = () => {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioContext = new AudioContext();
    }
  }
};

const loadBuffer = async () => {
  if (audioBuffer) return; // Already loaded

  try {
    const response = await fetch(timerSoundPath);
    const arrayBuffer = await response.arrayBuffer();
    
    if (!audioContext) initAudioContext();
    if (audioContext) {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    }
  } catch (error) {
    console.error("[TickTask] Failed to load/decode audio:", error);
  }
};

// Start loading immediately
loadBuffer();

// Keep-alive oscillator node
let keepAliveOscillator = null;

export const startKeepAlive = () => {
  if (!isAudioOn) return; // Do not start if audio is disabled
  if (!audioContext) initAudioContext();
  
  if (audioContext && !keepAliveOscillator) {
    try {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Play a very faint sound to keep the audio session active
      // Absolute silence (gain 0) might be optimized away by the OS
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 100; // Low frequency
      gain.gain.value = 0.001; // Extremely low volume (inaudible but active)
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.start();
      keepAliveOscillator = osc;
      console.log("[TickTask] Background audio keep-alive started");
    } catch (e) {
      console.error("[TickTask] Failed to start keep-alive:", e);
    }
  }
};

export const stopKeepAlive = () => {
  if (keepAliveOscillator) {
    try {
      keepAliveOscillator.stop();
      keepAliveOscillator.disconnect();
      keepAliveOscillator = null;
      console.log("[TickTask] Background audio keep-alive stopped");
    } catch (e) {
      console.error("[TickTask] Failed to stop keep-alive:", e);
    }
  }
};

export const playTimerEndSound = async () => {
  if (!isAudioOn) {
    console.log("[TickTask] Audio disabled, skipping sound.");
    return;
  }
  console.log("[TickTask] playTimerEndSound called");
  if (!audioContext) initAudioContext();
  if (!audioBuffer) await loadBuffer(); // Ensure loaded

  if (audioContext && audioBuffer) {
    // Ensure context is running (sometimes it suspends)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Stop keep-alive just before playing the real sound to avoid interference
    // (Though it's quiet enough to potentially keep running, cleaner to switch)
    // Actually, keeping it running might be safer until the sound finishes, 
    // but let's restart it if needed. For now, stopping it is fine as the 
    // "real" sound takes over the session.
    stopKeepAlive();

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start(0);
    console.log("[TickTask] Sound played via Web Audio API");
  }
};

/**
 * Unlocks audio playback on mobile/Safari by playing a silent sound
 * inside a user interaction event.
 */
export const unlockAudio = () => {
  if (!audioContext) initAudioContext();
  
  if (audioContext) {
    // 1. Resume context (critical for Chrome/Safari autoplay policies)
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log("[TickTask] AudioContext resumed");
      });
    }

    // 2. Play a silent buffer to "warm up" the output
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    console.log("[TickTask] Audio warm-up signal sent");
    
    // Also ensure our real buffer is loading
    if (!audioBuffer) loadBuffer();
  }
};
