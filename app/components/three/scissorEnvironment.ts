import * as THREE from 'three';

/**
 * A procedural studio lightbox, used as the scissor's environment map.
 *
 * This replaces three's stock RoomEnvironment, and it is the single biggest
 * change to how the model reads.
 *
 * Why it matters: a `metalness: 1` surface shows almost nothing of its own — it
 * is a mirror, so what you see is entirely the reflection of its surroundings.
 * Direct lights barely register on it (they contribute a small specular dot);
 * the environment map does the real work. RoomEnvironment is a generic grey
 * room, so metal lit by it looks like generic grey metal.
 *
 * A real product photographer lights chrome with long, narrow softboxes, because
 * a narrow source reflected in a curved blade becomes a long unbroken streak
 * that travels as the object turns. That is what this scene builds: two tall
 * strip lights, a broad key, a warm brass kicker and a dim floor bounce, all as
 * emissive planes inside a dark box.
 *
 * Costs nothing at runtime beyond one PMREM convolution at startup — no HDRI
 * download, no asset to license.
 */

interface Light {
  size: [number, number];
  position: [number, number, number];
  /** Euler XYZ in radians. */
  rotation: [number, number, number];
  color: string;
  intensity: number;
}

/* --- Why this rig was rebuilt ------------------------------------------------
 * The first version made the blades read as flat cream paper, and the cause was
 * the key light: a 9×6 slab at intensity 13 in a warm #fff3e0, sitting close
 * enough to cover most of the hemisphere the blade faces. A mirror shows you
 * its surroundings, so a blade facing one enormous even source reflects one
 * enormous even source — a single uniform wash, the same value corner to
 * corner, with the warm cast turning cool #c7cad2 steel into beige card.
 *
 * Chrome does not need more light. It needs more CONTRAST in what it can see:
 * bright sources with dark gaps between them, so the reflection has structure
 * to travel across as the object turns. The rebuild halves the key's area,
 * drops its intensity, and lets the dark room take back the space — the black
 * between the sources is doing as much work as the sources.
 * -------------------------------------------------------------------------- */
const LIGHTS: Light[] = [
  // Key. Was 9×6 at 13; now a third of the area and cooler, so it reads as a
  // softbox with an edge rather than as ambient daylight.
  {
    size: [5, 3.4],
    position: [4.6, 5.6, 5.2],
    rotation: [-0.72, 0.58, 0],
    color: '#fff1dd',
    intensity: 9,
  },
  // Tall cool strip, left, now the dominant source. This is the one that draws
  // the long unbroken highlight down the length of the blade as it turns — the
  // signature polished-steel cue — and it is what keeps the steel cool-grey
  // instead of letting the warm key tint the whole object.
  {
    size: [1.0, 15],
    position: [-7.2, 1.5, 3.8],
    rotation: [0, 1.05, 0],
    color: '#dbe7ff',
    intensity: 15,
  },
  // Second cool strip, high and slightly right, narrower still. Two strips at
  // different angles mean the blade always has one travelling across it at any
  // rotation the pointer can reach.
  {
    size: [0.7, 11],
    position: [3.4, 3.2, 6.2],
    rotation: [0, -0.25, 0.55],
    color: '#eaf1ff',
    intensity: 9,
  },
  // Narrow warm strip, right and behind. Separates the blade edge from the
  // background when the scissor turns away from the key.
  {
    size: [0.8, 13],
    position: [6.5, 1, -4.5],
    rotation: [0, -0.9, 0],
    color: '#ffdfb5',
    intensity: 7,
  },
  // Brass kicker, low front-left. Warms the finger rings from underneath and
  // ties the object to the one accent colour the brand actually owns.
  {
    size: [3.4, 3.4],
    position: [-3.5, -4, 5],
    rotation: [0.9, -0.3, 0],
    color: '#c8a35a',
    intensity: 4,
  },
  // Barber-pole red, low and far right, at the threshold of visible. The
  // palette reserves `--color-pole` for the 3D scene and then the scene never
  // used it. A single cool object in a warm brass page has nothing tying it to
  // the brand; one dull red edge along the underside of the blades does it
  // without anyone consciously noticing a red light.
  {
    size: [0.9, 7],
    position: [5.4, -3.2, 1.6],
    rotation: [0.35, -0.75, 0.2],
    color: '#b4302b',
    intensity: 5,
  },
  // Floor bounce. Stops the underside going pure black, which is what makes
  // chrome look like it was cut out of the page.
  {
    size: [16, 10],
    position: [0, -7, 0],
    rotation: [-Math.PI / 2, 0, 0],
    color: '#33333d',
    intensity: 1.8,
  },
];

/**
 * Builds the environment and returns the PMREM-convolved texture.
 *
 * The intermediate scene and its geometry are disposed immediately — only the
 * resulting cube texture is kept. Caller owns the returned texture.
 */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();

  // The room itself: a dark box, seen from the inside.
  const roomGeo = new THREE.BoxGeometry(22, 16, 22);
  const roomMat = new THREE.MeshStandardMaterial({
    side: THREE.BackSide,
    color: '#101014',
    roughness: 1,
    metalness: 0,
  });
  const room = new THREE.Mesh(roomGeo, roomMat);
  scene.add(room);

  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const materials: THREE.Material[] = [roomMat];

  for (const light of LIGHTS) {
    const mat = new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: new THREE.Color(light.color),
      emissiveIntensity: light.intensity,
      side: THREE.DoubleSide,
      roughness: 1,
      metalness: 0,
    });
    materials.push(mat);

    const mesh = new THREE.Mesh(planeGeo, mat);
    mesh.scale.set(light.size[0], light.size[1], 1);
    mesh.position.set(...light.position);
    mesh.rotation.set(...light.rotation);
    scene.add(mesh);
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  // A little blur: perfectly sharp sources give a hard, CG-looking highlight.
  const target = pmrem.fromScene(scene, 0.02);

  // Everything above was scaffolding for one convolution — release it.
  planeGeo.dispose();
  roomGeo.dispose();
  materials.forEach((m) => m.dispose());
  pmrem.dispose();

  return target.texture;
}
