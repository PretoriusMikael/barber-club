/**
 * Where the scissor sits, and how it cuts.
 *
 * Coordinate space: the camera is at z = 9 with a 32° vertical FOV, so the
 * visible frame at z = 0 is ALWAYS 5.16 units tall and `5.16 × aspect` wide.
 * Height is fixed; width is the only thing that moves. Every number below is
 * expressed against that, because the previous version hard-coded positions for
 * a 16:9 frame and then scaled them by a fudge factor — which is why the
 * scissor hung off the right edge of a 16:10 desktop and was sliced in half on
 * a phone. A composition that only holds at one aspect ratio is not composed.
 */

export interface Pose {
  /** Fraction of the frame's half-width. 0 = centre, 1 = the right edge. */
  xFraction: number;
  /** Absolute world units from centre. Frame half-height is 2.58. */
  y: number;
  /** Euler XYZ, radians. */
  rotation: [number, number, number];
  scale: number;
}

/** Vertical extent of the visible frame at z = 0. Derived, not guessed. */
export const FRAME_HEIGHT = 5.16;

/**
 * Overall length of the model along its local X, pivot to blade tip plus the
 * ring behind it. Used to check the pose actually fits before it ships.
 */
export const MODEL_LENGTH = 6.6;

/**
 * LANDSCAPE — the scissor owns the right-hand column, clear of the copy.
 *
 * The headline column ends around 62% of the viewport width, so anything left
 * of x ≈ 1.1 world units collides with type. The old pose put the blades
 * straight through "WELCOME TO THE CLUB." at a shallow 24°, which is the angle
 * that maximises the damage: long, flat and horizontal, right across the line.
 *
 * Standing it up to ~56° does three things at once. It fits the tall narrow gap
 * beside the copy instead of fighting it, it points the blades down and inward
 * so the object leads the eye into the headline rather than away from it, and
 * it is simply how a pair of shears is held.
 */
export const REST_POSE: Pose = {
  xFraction: 0.6,
  y: 0.12,
  rotation: [0.26, -0.52, -0.98],
  scale: 0.53,
};

/**
 * PORTRAIT — phones, where there is no right-hand column to own.
 *
 * On a 390-wide screen the frame is 2.4 units across in total, so the landscape
 * pose put the scissor's pivot outside the frame entirely and the visitor got a
 * finger ring and a wire disappearing off the edge. The empty band above the
 * headline is the only real estate a phone has spare, so the scissor moves into
 * it and turns nearly vertical.
 */
export const PORTRAIT_POSE: Pose = {
  xFraction: 0.44,
  y: 1.24,
  rotation: [0.22, -0.42, -1.16],
  scale: 0.34,
};

/**
 * The arrival.
 *
 * The scene used to appear at its final pose in one frame — the canvas mounted
 * and the scissor was simply there, which after a headline that animates in
 * word by word reads as a missing asset that turned up late. It now flies the
 * short distance from here to REST_POSE, so it arrives on purpose.
 *
 * Offsets, not absolutes: applied on top of whichever pose the aspect ratio
 * chose, so the entrance is identical on a phone and a monitor.
 */
export const ENTRY_OFFSET = {
  /** Starts further from the camera and drifts in. */
  z: -2.6,
  y: 0.55,
  /** Over-rotated on the roll axis, unwinding as it settles. */
  rotationZ: 0.34,
  scale: 0.86,
};

/** Seconds. Long enough to read as deliberate, short enough not to be a wait. */
export const ENTRY_DURATION = 1.0;

/**
 * Pause between the scissor settling and the blades closing.
 *
 * The cut used to be keyed to scroll — it fired once the visitor had scrolled
 * 14% of the first viewport. Two things were wrong with that. Anyone who read
 * the hero and then scrolled fast missed it completely, and anyone who did not
 * scroll at all never saw the one moment the scene exists for. Tying it to the
 * arrival instead means it plays for everybody, exactly once, while they are
 * still looking at the hero.
 */
export const CUT_DELAY = 0.42;

/** Blade angle, radians. */
export const BLADE_OPEN = 0.2;
/** Slight overlap at the end of the cut — real blades pass each other. */
export const BLADE_CLOSED = -0.012;

/** Seconds. */
export const CUT_DURATION = 0.42;

/**
 * How long to keep rendering after the cut finishes. Covers the tail of the
 * damped quiver, after which the pose is settled and the scene only redraws
 * when the pointer asks it to.
 */
export const CUT_SETTLE = 0.35;

/**
 * Pointer parallax limits, radians and world units.
 *
 * Small on purpose. The job is to prove the object has volume — that there is a
 * far side to it — not to let the visitor spin it. Anything past about 0.2 rad
 * stops reading as a lit object sitting in the page and starts reading as a
 * toy on a turntable, and it drags the blades back over the headline.
 */
export const POINTER_ROTATION = { x: 0.13, y: 0.2 };
export const POINTER_DRIFT = { x: 0.13, y: 0.1 };
