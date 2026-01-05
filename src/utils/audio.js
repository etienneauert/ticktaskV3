// ---------------------------------------------------------------------------
// HYBRID AUDIO UTILITY
// Uses Web Audio API for background support/precision, falls back to HTML5 Audio
// ---------------------------------------------------------------------------

import timerSoundPath from "../assets/audios/happy-message-ping-351298.mp3";

// Global State
let isAudioOn = localStorage.getItem("ticktask_audio_enabled") !== "false";
console.log("[TickTask] Audio initialized. isAudioOn:", isAudioOn);

// --- 1. HTML5 Audio (Fallback/Simple) ---
const html5Audio = new Audio(timerSoundPath);
html5Audio.preload = 'auto';

// --- 2. Web Audio API (Primary) ---
let audioContext = null;
let audioBuffer = null;
let keepAliveOscillator = null;

// Initialize Context
const initAudioContext = () => {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioContext = new AudioContext();
    }
  }
};

// Load Buffer
const loadBuffer = async () => {
  if (audioBuffer) return;
  try {
    const response = await fetch(timerSoundPath);
    const arrayBuffer = await response.arrayBuffer();
    if (!audioContext) initAudioContext();
    if (audioContext) {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    }
  } catch (error) {
    console.error("[TickTask] Web Audio load failed, will use HTML5 fallback:", error);
  }
};

// Start Loading immediately
loadBuffer();

// --- Public API ---

export const setAudioEnabled = (enabled) => {
  console.log("[TickTask] Set audio:", enabled);
  isAudioOn = enabled;
  localStorage.setItem("ticktask_audio_enabled", String(enabled));
  
  if (!enabled) {
    stopKeepAlive();
  } else {
    // If enabling, ensure we're ready
    loadBuffer();
  }
};

export const getAudioEnabled = () => {
  return isAudioOn;
};

/**
 * Resumes/Unlocks audio engines. Must be called on User Interaction.
 */
export const unlockAudio = () => {
  if (!audioContext) initAudioContext();

  // 1. Unlock HTML5 Audio
  if (html5Audio) {
    html5Audio.volume = 0;
    html5Audio.play().then(() => {
      html5Audio.pause();
      html5Audio.currentTime = 0;
      html5Audio.volume = 1;
      console.log("[TickTask] HTML5 Audio unlocked");
    }).catch(e => console.log("HTML5 unlock fail (harmless)", e));
  }

  // 2. Unlock Web Audio
  if (audioContext) {
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => console.log("[TickTask] WA Context resumed"));
    }
    // Play silent buffer
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
  }
};

/**
 * Starts background "hum" to keep iOS Audio Session active.
 * Only works with Web Audio API.
 */
export const startKeepAlive = () => {
  if (!isAudioOn) return;
  if (!audioContext) initAudioContext();
  
  if (audioContext && !keepAliveOscillator) {
    try {
      if (audioContext.state === 'suspended') audioContext.resume();
      
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.value = 60; // Inaudible low freq
      gain.gain.value = 0.001; // Virtually silent
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start();
      keepAliveOscillator = osc;
      console.log("[TickTask] Keep-alive started");
    } catch (e) {
      console.error("[TickTask] Keep-alive failed:", e);
    }
  }
};

export const stopKeepAlive = () => {
  if (keepAliveOscillator) {
    try {
      keepAliveOscillator.stop();
      keepAliveOscillator.disconnect();
      keepAliveOscillator = null;
    } catch (e) {}
  }
};

/**
 * Plays the success sound.
 * Tries Web Audio first, falls back to HTML5.
 */
export const playTimerEndSound = async () => {
  if (!isAudioOn) return;
  console.log("[TickTask] Playing Timer Sound...");
  
  // Try Web Audio first
  let playedViaWebAudio = false;
  
  if (audioContext && audioBuffer) {
    try {
      if (audioContext.state === 'suspended') await audioContext.resume();
      stopKeepAlive(); // Clean switch
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      const gain = audioContext.createGain();
      gain.gain.value = 1.0;
      source.connect(gain);
      gain.connect(audioContext.destination);
      source.start(0);
      playedViaWebAudio = true;
      console.log("[TickTask] Played via Web Audio");
    } catch (e) {
      console.error("[TickTask] Web Audio play failed:", e);
    }
  }

  // Fallback to HTML5 if Web Audio didn't play (e.g. not loaded or error)
  if (!playedViaWebAudio) {
    console.log("[TickTask] Falling back to HTML5 Audio");
    try {
      html5Audio.currentTime = 0;
      html5Audio.volume = 1.0;
      const promise = html5Audio.play();
      if (promise) {
        promise.catch(e => console.error("[TickTask] HTML5 Play failed:", e));
      }
    } catch (e) {
      console.error("[TickTask] HTML5 Play error:", e);
    }
  }
};
