/**
 * The scissor's single resting pose, and the cut.
 *
 * This replaces the old scroll-keyed flight path. The scissor no longer travels
 * the document — it sits in the hero, cuts once, and is then completely static.
 * Because there is exactly one pose, there is no interpolation, no sampling and
 * nothing running per frame once the cut has finished.
 *
 * Coordinate space: camera at z = 9 with a 32° vertical FOV, so the visible
 * frame at z = 0 is ~5.2 units tall and ~9.2 wide on a 16:9 screen.
 */

export interface Pose {
  position: [number, number, number];
  /** Euler XYZ, radians. */
  rotation: [number, number, number];
  scale: number;
}

/**
 * Upper right of the hero, angled into frame, clear of the headline column.
 * Scale is deliberately modest — this is an accent beside the copy, not a
 * centrepiece competing with it.
 */
export const REST_POSE: Pose = {
  position: [2.55, 0.75, 0],
  rotation: [0.3, -0.6, -0.42],
  scale: 0.5,
};

/**
 * Fraction of the first viewport scrolled before the blades close.
 *
 * Kept small on purpose. The scissor is anchored in the hero now, so it leaves
 * the screen along with everything else — trigger it too late and the cut plays
 * out above the fold line where nobody sees it.
 */
export const CUT_AT_VIEWPORT_FRACTION = 0.14;

/** Blade angle, radians. */
export const BLADE_OPEN = 0.2;
/** Slight overlap at the end of the cut — real blades pass each other. */
export const BLADE_CLOSED = -0.012;

/** Seconds. */
export const CUT_DURATION = 0.42;

/**
 * How long to keep rendering after the cut finishes. Covers the tail of the
 * damped quiver, after which the scene is byte-for-byte identical every frame
 * and rendering stops entirely.
 */
export const CUT_SETTLE = 0.35;
