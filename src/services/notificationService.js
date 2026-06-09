// === Local PWA Notification Service ===

let sharedAudioContext = null;

/**
 * Initialize and resume AudioContext on user gesture to "unlock" audio capabilities in modern mobile browsers.
 */
export function unlockAudioContext() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContextClass();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume();
    }
    console.log('AudioContext unlocked. State:', sharedAudioContext.state);
  } catch (e) {
    console.warn('Failed to unlock AudioContext:', e);
  }
}

/**
 * Play a high-fidelity synthesizer notification chime using the Web Audio API.
 * This works natively on mobile/desktop browsers without needing external audio asset files.
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    // Use pre-unlocked shared context, or create a new one as fallback
    const audioCtx = sharedAudioContext || new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // First note (chime)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
    gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.4);

    // Second note (harmonic chime, slightly delayed)
    setTimeout(() => {
      try {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5 note
        gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.6);
      } catch (innerError) {
        // Ignore AudioContext state issues on quick multiple clicks
      }
    }, 120);

  } catch (e) {
    console.warn('Failed to play notification audio:', e);
  }
}

/**
 * Request permission for browser local notifications.
 * Falls back to in-app simulated notifications if the API is blocked due to HTTP/insecure context.
 * @returns {Promise<boolean>} True if permission granted or fallback enabled
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support native notifications (likely due to insecure HTTP connection)');
    localStorage.setItem('sportag_in_app_notifications', 'true');
    return true;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return true;
    } else {
      // If user denied, we still allow in-app fallback testing
      localStorage.setItem('sportag_in_app_notifications', 'true');
      return true;
    }
  } catch (e) {
    localStorage.setItem('sportag_in_app_notifications', 'true');
    return true;
  }
}

/**
 * Check if notifications are enabled (native or fallback)
 * @returns {boolean}
 */
export function isNotificationEnabled() {
  const nativeGranted = 'Notification' in window && Notification.permission === 'granted';
  const fallbackGranted = localStorage.getItem('sportag_in_app_notifications') === 'true';
  return nativeGranted || fallbackGranted;
}

/**
 * Dispatch a local browser notification or falls back to an in-app toast
 * @param {string} title - Notification title
 * @param {Object} [options] - Standard Notification options
 */
export function showLocalNotification(title, options = {}) {
  const defaultOptions = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'he',
    ...options
  };

  let nativeSent = false;

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, defaultOptions);
      nativeSent = true;
    } catch (e) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, defaultOptions);
        });
        nativeSent = true;
      }
    }
  }

  // Play synthetic chime sound for in-app alert
  playNotificationSound();

  // Always dispatch the custom event as well, so that if the browser is currently active, 
  // we show a beautiful in-app toast notification (simulating native system banner).
  const inAppEvent = new CustomEvent('sportag-in-app-notify', {
    detail: {
      title,
      body: options.body || '',
      nativeSent
    }
  });
  window.dispatchEvent(inAppEvent);
}

/**
 * Schedule a simulated workout reminder in 5 seconds (mock scheduling for testing)
 */
export function scheduleMockReminder(message = 'הגיע הזמן לתרגול היומי שלך! 💪') {
  setTimeout(() => {
    showLocalNotification('Physio-AI Pro - תזכורת תרגול', {
      body: message,
      tag: 'workout-reminder',
    });
  }, 5000);
}
