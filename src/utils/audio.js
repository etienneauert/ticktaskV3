
import timerSoundPath from "../assets/audios/correct-356013.mp3";

// Web Audio API Context
let audioContext = null;
let audioBuffer = null;

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

export const playTimerEndSound = async () => {
  console.log("[TickTask] playTimerEndSound called");
  if (!audioContext) initAudioContext();
  if (!audioBuffer) await loadBuffer(); // Ensure loaded

  if (audioContext && audioBuffer) {
    // Ensure context is running (sometimes it suspends)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

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
