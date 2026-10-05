import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  Raycaster,
  Scene,
  ShadowMaterial,
  ShapePath,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Shape,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import sortData from '../data/type-sorts.json';

type FaceKey = keyof typeof sortData;
type GlyphData = { advance: number; bounds: number[]; path: string };
type FaceData = { unitsPerEm: number; ascender: number; descender: number; glyphs: Record<string, GlyphData> };

type Sort = {
  group: Group;
  face: MeshStandardMaterial | null;
  glyph: GlyphData | null;
  scale: number;
  mid: number;
  width: number;
  home: Vector2;
  offset: Vector2;
  velocity: Vector2;
  yaw: number;
  spin: number;
  ink: number;
};

type Phase = 'idle' | 'inking' | 'pressing' | 'lifting' | 'proofed' | 'distributing';

/** The forme, top to bottom as it will read on the proof. Sizes are in ems of the Latin line. */
const FORME: readonly { text: string; face: FaceKey; size: number }[] = [
  { text: 'Lucas', face: 'latin', size: 1 },
  { text: 'Flatwhite', face: 'latin', size: 1 },
  { text: '루카스 플랫화이트', face: 'hangul', size: 0.62 },
];

// Type-high is the same for every size of type, so every sort stands equally tall.
const TYPE_HIGH = 0.8;
const SPACER_HIGH = 0.52;
const RELIEF = 0.07;
const SEAM = 0.012;
const LINE_GAP = 0.08;
const SPACE_EM = 0.32;
const PUSH_RADIUS = 1.15;
const SPRING = 20;
const DAMPING = 5.5;
const CAMERA_ELEVATION = (50 * Math.PI) / 180;
/** How far the camera pulls back (as a share of its framing) to show the standing proof. */
const WIDE_PULL = 0.48;

const FOAM = new Color('#f2f3f7');
const INK = new Color('#0e1a5e');
const BODY = new Color('#8e97bb');
const METAL = new Color('#e4e8f6');
const CREMA = new Color('#ffc457');

const faces = sortData as unknown as Record<FaceKey, FaceData>;

function parseCommands(path: string): (string | number)[] {
  return (path.match(/[MLHVQCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map((token) =>
    /[A-Z]/i.test(token) ? token.toUpperCase() : Number(token),
  );
}

/** Builds glyph outlines mirrored left to right, the way a letter sits on the face of a sort. */
function glyphShapes(glyph: GlyphData, scale: number, mid: number): Shape[] {
  const mirror = (x: number) => (glyph.advance / 2 - x) * scale;
  const lift = (y: number) => (y - mid) * scale;
  const tokens = parseCommands(glyph.path);
  const shape = new ShapePath();
  let x = 0;
  let y = 0;
  let index = 0;
  let command = 'M';
  const next = () => tokens[index++] as number;

  while (index < tokens.length) {
    if (typeof tokens[index] === 'string') {
      command = tokens[index++] as string;
    }

    switch (command) {
      case 'M':
        x = next();
        y = next();
        shape.moveTo(mirror(x), lift(y));
        command = 'L';
        break;
      case 'L':
        x = next();
        y = next();
        shape.lineTo(mirror(x), lift(y));
        break;
      case 'H':
        x = next();
        shape.lineTo(mirror(x), lift(y));
        break;
      case 'V':
        y = next();
        shape.lineTo(mirror(x), lift(y));
        break;
      case 'Q': {
        const cx = next();
        const cy = next();
        x = next();
        y = next();
        shape.quadraticCurveTo(mirror(cx), lift(cy), mirror(x), lift(y));
        break;
      }
      case 'C': {
        const c1x = next();
        const c1y = next();
        const c2x = next();
        const c2y = next();
        x = next();
        y = next();
        shape.bezierCurveTo(mirror(c1x), lift(c1y), mirror(c2x), lift(c2y), mirror(x), lift(y));
        break;
      }
      default:
        // Z closes the contour; the next M starts a new one.
        break;
    }
  }

  // three.js sorts outer contours from counters (holes) by winding on its own.
  return shape.toShapes();
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export type TypeCase = {
  proof: () => void;
  distribute: () => void;
  phase: () => Phase;
};

export function mountTypeCase(
  canvas: HTMLCanvasElement,
  onPhase: (phase: Phase) => void,
): TypeCase {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.25;
  pmrem.dispose();

  const camera = new PerspectiveCamera(28, 1, 0.1, 100);
  const key = new DirectionalLight('#ffffff', 2.2);
  key.position.set(-4, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.radius = 4;
  scene.add(key, new HemisphereLight('#dfe4ff', '#16278a', 0.6));

  // Cast bodies are dull; the faces are polished where the type is struck.
  const metal = new MeshStandardMaterial({ color: BODY, metalness: 1, roughness: 0.44 });
  const sorts: Sort[] = [];
  const forme = new Group();
  scene.add(forme);

  // Measure every line, then set them flush to one edge. On the face of the type that
  // edge is on the right: the forme is the mirror image of the page it will print.
  const lines = FORME.map((line) => {
    const face = faces[line.face];
    const scale = line.size / face.unitsPerEm;
    const depth = (face.ascender - face.descender) * scale;
    const mid = (face.ascender + face.descender) / 2;
    const cells = [...line.text].map((char) => {
      const glyph = face.glyphs[char] ?? null;
      return { char, glyph, width: glyph ? glyph.advance * scale : SPACE_EM * line.size };
    });
    return { scale, depth, mid, cells, width: cells.reduce((sum, cell) => sum + cell.width, 0) };
  });

  const formeWidth = Math.max(...lines.map((line) => line.width));
  const formeDepth = lines.reduce((sum, line) => sum + line.depth, 0) + LINE_GAP * (lines.length - 1);
  let z = -formeDepth / 2;

  for (const line of lines) {
    const lineZ = z + line.depth / 2;
    let right = formeWidth / 2;

    for (const cell of line.cells) {
      const x = right - cell.width / 2;
      right -= cell.width;
      const group = new Group();
      const high = cell.glyph ? TYPE_HIGH : SPACER_HIGH;
      const body = new Mesh(new BoxGeometry(cell.width - SEAM, high, line.depth - SEAM), metal);
      body.position.y = high / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      let face: MeshStandardMaterial | null = null;

      if (cell.glyph) {
        face = new MeshStandardMaterial({ color: METAL.clone(), metalness: 1, roughness: 0.16 });
        const relief = new ExtrudeGeometry(glyphShapes(cell.glyph, line.scale, line.mid), {
          depth: RELIEF,
          bevelEnabled: true,
          bevelThickness: 0.012,
          bevelSize: 0.008,
          bevelSegments: 1,
          curveSegments: 6,
        });
        relief.rotateX(-Math.PI / 2);
        const letter = new Mesh(relief, face);
        letter.position.y = TYPE_HIGH;
        letter.castShadow = true;
        group.add(letter);
      }

      group.position.set(x, 0, lineZ);
      forme.add(group);
      sorts.push({
        group,
        face,
        glyph: cell.glyph,
        scale: line.scale,
        mid: line.mid,
        width: cell.width,
        home: new Vector2(x, lineZ),
        offset: new Vector2(),
        velocity: new Vector2(),
        yaw: 0,
        spin: 0,
        ink: 0,
      });
    }

    z += line.depth + LINE_GAP;
  }

  // The galley: a shallow tray with rims on three sides, as type is kept between jobs.
  const margin = 0.5;
  const galleyWidth = formeWidth + margin * 2;
  const galleyDepth = formeDepth + margin * 2;
  const galleyMaterial = new MeshStandardMaterial({ color: '#16278a', metalness: 0.7, roughness: 0.45 });
  const plate = new Mesh(new BoxGeometry(galleyWidth, 0.06, galleyDepth), galleyMaterial);
  plate.position.y = -0.03;
  plate.receiveShadow = true;
  const rimHeight = 0.32;
  const rims = [
    { w: galleyWidth, d: 0.08, x: 0, z: -galleyDepth / 2 },
    { w: 0.08, d: galleyDepth, x: -galleyWidth / 2, z: 0 },
    { w: 0.08, d: galleyDepth, x: galleyWidth / 2, z: 0 },
  ].map((rim) => {
    const mesh = new Mesh(new BoxGeometry(rim.w, rimHeight, rim.d), galleyMaterial);
    mesh.position.set(rim.x, rimHeight / 2 - 0.06, rim.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  });
  const floor = new Mesh(new PlaneGeometry(60, 60), new ShadowMaterial({ color: '#0e1a5e', opacity: 0.38 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.061;
  floor.receiveShadow = true;
  scene.add(plate, ...rims, floor);

  // Ink roller and proof paper, parked out of frame until a proof is pulled.
  const rollerRadius = 0.22;
  const roller = new Mesh(
    new CylinderGeometry(rollerRadius, rollerRadius, galleyDepth - 0.3, 32),
    new MeshStandardMaterial({ color: CREMA, metalness: 0.1, roughness: 0.55 }),
  );
  roller.rotation.x = Math.PI / 2;
  roller.castShadow = true;
  roller.visible = false;
  scene.add(roller);

  const paperWidth = formeWidth + 0.5;
  const paperDepth = formeDepth + 0.5;
  const printCanvas = document.createElement('canvas');
  printCanvas.width = 2048;
  printCanvas.height = Math.round((2048 * paperDepth) / paperWidth);
  const printTexture = new CanvasTexture(printCanvas);
  printTexture.colorSpace = SRGBColorSpace;
  printTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // The proof sheet pivots on its centre: lowered flat onto the forme, then lifted and
  // turned the way a printer turns a proof toward the light to read it.
  const hinge = new Group();
  const printed = new Mesh(
    new PlaneGeometry(paperWidth, paperDepth).rotateX(Math.PI / 2),
    // Paper is matte: keep the room's reflection from veiling the ink.
    new MeshStandardMaterial({ map: printTexture, roughness: 1, envMapIntensity: 0.2, transparent: true }),
  );
  const blank = new Mesh(
    new PlaneGeometry(paperWidth, paperDepth).rotateX(-Math.PI / 2),
    new MeshStandardMaterial({ color: FOAM, roughness: 1, envMapIntensity: 0.2, transparent: true }),
  );
  for (const sheet of [printed, blank]) {
    sheet.castShadow = true;
    hinge.add(sheet);
  }
  hinge.visible = false;
  scene.add(hinge);

  const paperRest = TYPE_HIGH + RELIEF + 0.02;
  const flat = new Quaternion();
  // Turn the sheet end for end, then stand it up so the printed side faces the camera.
  const facing = new Quaternion()
    .setFromAxisAngle(new Vector3(1, 0, 0), -(Math.PI / 2 + CAMERA_ELEVATION))
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI));
  const standing = new Vector3(
    0,
    TYPE_HIGH + 0.55 + (paperDepth / 2) * Math.cos(CAMERA_ELEVATION),
    -galleyDepth / 2 - 0.25 - (paperDepth / 2) * Math.sin(CAMERA_ELEVATION),
  );
  let wide = 0;

  const drawProof = () => {
    const ctx = printCanvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const kx = printCanvas.width / paperWidth;
    const ky = printCanvas.height / paperDepth;
    const xMin = -paperWidth / 2;
    const zMax = paperDepth / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `#${FOAM.getHexString()}`;
    ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);

    // A contact print: every inked face lands on the paper exactly where the sort stands now.
    for (const sort of sorts) {
      if (!sort.glyph || sort.ink < 0.05) {
        continue;
      }

      const { scale: s, mid } = sort;
      const cos = Math.cos(sort.yaw);
      const sin = Math.sin(sort.yaw);
      const sx = sort.home.x + sort.offset.x;
      const sz = sort.home.y + sort.offset.y;
      const halfAdvance = (sort.glyph.advance / 2) * s;
      const x0 = sx + cos * halfAdvance + sin * mid * s;
      const z0 = sz - sin * halfAdvance + cos * mid * s;
      ctx.setTransform(
        kx * -s * cos,
        -ky * s * sin,
        kx * -s * sin,
        ky * s * cos,
        kx * (x0 - xMin),
        ky * (zMax - z0),
      );
      ctx.globalAlpha = 0.94 * sort.ink;
      ctx.fillStyle = `#${INK.getHexString()}`;
      ctx.fill(new Path2D(sort.glyph.path));
    }

    ctx.globalAlpha = 1;
    printTexture.needsUpdate = true;
  };

  // Camera: frame the galley at a fixed elevation, backing off on narrow screens.
  const target = new Vector3(0, 0.2, 0.15);
  const frame = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (width === 0 || height === 0) {
      return;
    }

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const vertical = (camera.fov * Math.PI) / 360;
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    const reach =
      Math.max((galleyWidth / 2 + 0.3) / Math.tan(horizontal), (galleyDepth * 0.9) / Math.tan(vertical)) *
      (1 + WIDE_PULL * wide);
    const aim = new Vector3(target.x, target.y + 0.95 * wide, target.z - 0.85 * wide);
    camera.position.set(
      aim.x,
      aim.y + Math.sin(CAMERA_ELEVATION) * reach,
      aim.z + Math.cos(CAMERA_ELEVATION) * reach,
    );
    camera.lookAt(aim);
    camera.updateProjectionMatrix();
  };

  // Pointer: a ray onto the galley floor; sorts within reach are shoved away from it.
  const raycaster = new Raycaster();
  const floorPlane = new Plane(new Vector3(0, 1, 0), -TYPE_HIGH / 2);
  const pointer = { active: false, point: new Vector3(), last: new Vector3(), speed: 0 };
  const ndc = new Vector2();

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.ray.intersectPlane(floorPlane, new Vector3());

    if (hit) {
      pointer.speed = pointer.active ? hit.distanceTo(pointer.point) : 0;
      pointer.last.copy(pointer.point);
      pointer.point.copy(hit);
      pointer.active = true;
      wake();
    }
  });
  canvas.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  let phase: Phase = 'idle';
  let phaseStart = 0;
  const setPhase = (next: Phase) => {
    phase = next;
    phaseStart = performance.now();
    onPhase(next);
    wake();
  };

  const stepSorts = (dt: number): boolean => {
    let moving = false;
    const away = new Vector2();

    for (const sort of sorts) {
      const x = sort.home.x + sort.offset.x;
      const z = sort.home.y + sort.offset.y;

      if (pointer.active && phase !== 'pressing') {
        away.set(x - pointer.point.x, z - pointer.point.z);
        const distance = away.length();

        if (distance < PUSH_RADIUS && distance > 1e-4) {
          const force = (1 - distance / PUSH_RADIUS) * (14 + pointer.speed * 120);
          away.multiplyScalar(1 / distance);
          sort.velocity.addScaledVector(away, force * dt);
          const sweep = pointer.point.x - pointer.last.x;
          sort.spin += (away.y * sweep - away.x * (pointer.point.z - pointer.last.z)) * 40 * dt;
        }
      }

      sort.velocity.addScaledVector(sort.offset, -SPRING * dt);
      sort.velocity.multiplyScalar(Math.exp(-DAMPING * dt));
      sort.offset.addScaledVector(sort.velocity, dt);
      sort.spin += -sort.yaw * SPRING * dt;
      sort.spin *= Math.exp(-DAMPING * dt);
      sort.yaw += sort.spin * dt;

      if (sort.velocity.lengthSq() > 1e-6 || sort.offset.lengthSq() > 1e-6 || Math.abs(sort.spin) > 1e-3) {
        moving = true;
      }
    }

    // Keep displaced sorts from passing through one another.
    for (let i = 0; i < sorts.length; i += 1) {
      for (let j = i + 1; j < sorts.length; j += 1) {
        const a = sorts[i];
        const b = sorts[j];
        const dx = b.home.x + b.offset.x - (a.home.x + a.offset.x);
        const dz = b.home.y + b.offset.y - (a.home.y + a.offset.y);
        const reach = (Math.min(a.width, 0.9) + Math.min(b.width, 0.9)) * 0.42;
        const distance = Math.hypot(dx, dz);

        if (distance < reach && distance > 1e-4) {
          const push = (reach - distance) / 2 / distance;
          a.offset.x -= dx * push;
          a.offset.y -= dz * push;
          b.offset.x += dx * push;
          b.offset.y += dz * push;
        }
      }
    }

    pointer.speed *= 0.6;

    for (const sort of sorts) {
      sort.group.position.set(sort.home.x + sort.offset.x, 0, sort.home.y + sort.offset.y);
      sort.group.rotation.y = sort.yaw;
    }

    return moving;
  };

  const setInk = (sort: Sort, amount: number) => {
    sort.ink = amount;
    sort.face?.color.copy(METAL).lerp(INK, amount);

    if (sort.face) {
      sort.face.metalness = 1 - amount * 0.75;
      sort.face.roughness = 0.16 + amount * 0.26;
    }
  };

  const stepPhase = (now: number): boolean => {
    const t = now - phaseStart;
    const speed = reduceMotion ? 1e6 : 1;
    const rollerTravel = galleyWidth + 1.2;

    switch (phase) {
      case 'inking': {
        const progress = clamp01((t * speed) / 1100);
        const rollerX = galleyWidth / 2 + 0.6 - rollerTravel * easeInOut(progress);
        roller.visible = true;
        roller.position.set(rollerX, TYPE_HIGH + RELIEF + rollerRadius, 0.05);
        // Roll about the cylinder's own axis as it travels.
        roller.rotation.y = (rollerTravel * easeInOut(progress)) / rollerRadius;

        for (const sort of sorts) {
          const x = sort.home.x + sort.offset.x;
          setInk(sort, Math.max(sort.ink, clamp01((x - rollerX + sort.width / 2) / 0.4)));
        }

        if (progress >= 1) {
          roller.visible = false;
          hinge.visible = true;
          hinge.quaternion.copy(flat);
          hinge.position.set(0, 4, 0);
          setPhase('pressing');
        }

        return true;
      }
      case 'pressing': {
        const progress = clamp01((t * speed) / 650);
        const drop = easeInOut(clamp01(progress / 0.7));
        hinge.position.set(0, 4 + (paperRest - 4) * drop, 0);
        const dip = progress > 0.7 ? Math.sin(((progress - 0.7) / 0.3) * Math.PI) * 0.03 : 0;

        for (const sort of sorts) {
          sort.group.position.y = -dip;
        }

        if (progress >= 1) {
          drawProof();
          setPhase('lifting');
        }

        return true;
      }
      case 'lifting': {
        const raw = clamp01((t * speed) / 1600);
        const progress = easeInOut(raw);
        hinge.position.lerpVectors(new Vector3(0, paperRest, 0), standing, progress);
        hinge.position.y += Math.sin(raw * Math.PI) * 0.6;
        hinge.quaternion.slerpQuaternions(flat, facing, progress);
        wide = progress;
        frame();

        if (progress >= 1) {
          setPhase('proofed');
        }

        return true;
      }
      case 'distributing': {
        const progress = clamp01((t * speed) / 900);
        hinge.position.set(standing.x, standing.y + 5 * easeInOut(progress), standing.z);
        wide = 1 - easeInOut(progress);
        frame();
        for (const sheet of [printed, blank]) {
          (sheet.material as MeshStandardMaterial).opacity = 1 - progress;
        }

        for (const sort of sorts) {
          setInk(sort, Math.min(sort.ink, 1 - progress));
        }

        if (progress >= 1) {
          hinge.visible = false;
          for (const sheet of [printed, blank]) {
            (sheet.material as MeshStandardMaterial).opacity = 1;
          }
          setPhase('idle');
        }

        return true;
      }
      default:
        return false;
    }
  };

  let handle = 0;
  let last = 0;
  let onScreen = false;

  const tick = (now: number) => {
    handle = 0;
    const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
    last = now;
    const moving = stepSorts(dt);
    const animating = stepPhase(now);
    renderer.render(scene, camera);

    if ((moving || animating || pointer.active) && onScreen && !document.hidden) {
      handle = requestAnimationFrame(tick);
    } else {
      last = 0;
    }
  };

  function wake() {
    if (!handle && onScreen && !document.hidden) {
      handle = requestAnimationFrame(tick);
    }
  }

  new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    wake();
  }).observe(canvas);
  document.addEventListener('visibilitychange', wake);
  new ResizeObserver(() => {
    frame();
    renderer.render(scene, camera);
  }).observe(canvas);

  frame();
  renderer.render(scene, camera);

  return {
    proof: () => {
      if (phase === 'idle') {
        setPhase('inking');
      }
    },
    distribute: () => {
      if (phase === 'proofed') {
        setPhase('distributing');
      }
    },
    phase: () => phase,
  };
}
