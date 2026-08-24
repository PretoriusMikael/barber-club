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

/* --- SNIP SNIP -------------------------------------------------------------
 *
 * Click the scissor and it cuts twice, the way a barber actually does it.
 *
 * What that means, from watching one work rather than from imagining it:
 *
 *   A barber's snip is ASYMMETRIC. The close is fast and the open is slower —
 *   the blades are driven shut and then relax apart. An even open-close reads
 *   as a machine, and it is the single most common tell in a fake one.
 *
 *   They come in pairs and threes, not singly, at roughly five a second, and
 *   the hand TRAVELS between them. A barber is working along a section, so the
 *   tool advances a little each snip and the wrist rolls with it. Two snips in
 *   exactly the same place is a prop being demonstrated, not a cut.
 *
 *   The second snip is smaller than the first. The hand is already moving, so
 *   the blades do not reopen as far.
 *
 * `TRAVEL` is along the blade axis, so the tool advances the way it is pointing
 * rather than sliding sideways across the screen.
 * -------------------------------------------------------------------------- */
export const SNIP = {
  /** Blades part to here before the first cut. Radians. */
  openA: 0.46,
  /** And to here before the second — less, because the hand is already moving. */
  openB: 0.33,

  /** Seconds. The open is nearly twice the close: that ratio is the whole feel. */
  openTime: 0.13,
  closeTime: 0.075,
  /** Beat between the two cuts. */
  gap: 0.055,

  /** How far the tool advances along its own blade axis, in local units. */
  travel: 0.42,
  /** Wrist roll accumulated across the pair, radians. */
  roll: 0.1,
  /** A small lift, so the travel is an arc rather than a slide. */
  lift: 0.12,

  /** Time to drift back to rest once the second cut lands. */
  recover: 0.42,

  /** Amplitude of the damped ring as the blades meet. */
  ring: 0.045,
} as const;

/** Total length of the sequence, derived so nothing has to be kept in sync. */
export const SNIP_DURATION =
  SNIP.openTime + SNIP.closeTime + SNIP.gap + SNIP.openTime + SNIP.closeTime + SNIP.recover;

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
