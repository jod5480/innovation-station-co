/**
 * haptics.ts — Web Vibration API wrapper for Instagram-style haptic feedback
 * Falls back silently on platforms that don't support navigator.vibrate.
 */

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silent fail on restricted environments
    }
  }
}

/** Short light tap — like tapping a button (notification tap) */
export function hapticLight() {
  vibrate(8);
}

/** Medium tap — like toggling a switch or liking a post */
export function hapticMedium() {
  vibrate(18);
}

/** Heavy tap — like double-tap heart burst */
export function hapticHeavy() {
  vibrate([12, 6, 24]);
}

/** Success pattern — like submitting a comment or sharing */
export function hapticSuccess() {
  vibrate([10, 40, 10]);
}

/** Error pattern — for invalid actions */
export function hapticError() {
  vibrate([20, 30, 20, 30, 20]);
}

/** Navigation snap — when switching tabs */
export function hapticNavSnap() {
  vibrate(6);
}
