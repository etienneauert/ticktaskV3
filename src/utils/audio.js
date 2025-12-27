
import timerSoundPath from "../assets/audios/correct-356013.mp3";

// Create a singleton instance to ensure the file is loaded/cached
const audio = new Audio(timerSoundPath);
audio.preload = 'auto';
// Attempt to set volume to max, though effective volume depends on system/browser
audio.volume = 1.0;

export const playTimerEndSound = () => {
  console.log("[TickTask] Triggering timer end sound...");
  
  // Reset audio to start (allows replay)
  audio.currentTime = 0;
  
  const playPromise = audio.play();
  
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log("[TickTask] Audio playback started successfully.");
      })
      .catch((error) => {
        console.error("[TickTask] Audio playback failed. Cause:", error);
        // Possible reasons: Autoplay blocked, file not found, format unsupported
      });
  }
};

/**
 * Unlocks audio playback on mobile/Safari by playing a silent burst
 * immediately upon user interaction (e.g., Start button click).
 */
export const unlockAudio = () => {
  if (audio) {
    const originalVolume = audio.volume;
    audio.volume = 0; // Mute for warmup
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Immediately pause and reset
          audio.pause();
          audio.currentTime = 0;
          audio.volume = originalVolume; // Restore volume
          console.log("[TickTask] Audio context unlocked.");
        })
        .catch((e) => {
          // Verify if we can just swallow this or log it
          console.log("[TickTask] Audio unlock attempt skipped/failed:", e);
        });
    }
  }
};
