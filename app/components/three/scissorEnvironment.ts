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

const LIGHTS: Light[] = [
  // Broad warm key, high and front-right. Fills the flat of the blade.
  {
    size: [9, 6],
    position: [5, 6.5, 5],
    rotation: [-0.75, 0.6, 0],
    color: '#fff3e0',
    intensity: 13,
  },
  // Tall cool strip, left. This is the one that draws the long highlight down
  // the length of the blade as it rotates — the signature "polished steel" cue.
  {
    size: [1.1, 15],
    position: [-7.5, 1.5, 3.5],
    rotation: [0, 1.05, 0],
    color: '#e2ecff',
    intensity: 10,
  },
  // Narrow warm strip, right and behind. Separates the blade edge from the
  // background when the scissor turns away from the key.
  {
    size: [0.8, 13],
    position: [6.5, 1, -4.5],
    rotation: [0, -0.9, 0],
    color: '#ffdfb5',
    intensity: 8,
  },
  // Brass kicker, low front-left. Warms the finger rings from underneath.
  {
    size: [4, 4],
    position: [-3.5, -4, 5],
    rotation: [0.9, -0.3, 0],
    color: '#c8a35a',
    intensity: 4.5,
  },
  // Floor bounce. Stops the underside going pure black, which is what makes
  // chrome look like it was cut out of the page.
  {
    size: [16, 10],
    position: [0, -7, 0],
    rotation: [-Math.PI / 2, 0, 0],
    color: '#3a3a46',
    intensity: 2,
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
