import * as THREE from 'three';

/**
 * Flor procedural no estilo peônia.
 *
 * Cada pétala é uma malha própria presa a uma "dobradiça" na base. A abertura
 * combina duas coisas: a rotação da dobradiça (a pétala se inclina para fora)
 * e um morph target (a pétala perde a concavidade e a ponta se curva para trás).
 * Assim a flor abre de verdade, camada por camada, em vez de crescer em escala.
 */

interface LayerSpec {
  count: number;
  radius: number;
  length: number;
  width: number;
  closedTilt: number;
  openTilt: number;
  cupClosed: number;
  cupOpen: number;
  /** atraso relativo na abertura (0 = abre primeiro) */
  delay: number;
  colorBase: string;
  colorMid: string;
  colorTip: string;
}

const LAYERS: LayerSpec[] = [
  // camadas de dentro para fora: miolo mais saturado, pétalas externas mais claras
  { count: 5, radius: 0.06, length: 0.6, width: 0.34, closedTilt: -0.3, openTilt: 0.22, cupClosed: 1.05, cupOpen: 0.9, delay: 0.46, colorBase: '#7e1640', colorMid: '#cf5a82', colorTip: '#ee9fb8' },
  { count: 7, radius: 0.11, length: 0.78, width: 0.4, closedTilt: -0.2, openTilt: 0.5, cupClosed: 1.0, cupOpen: 0.75, delay: 0.38, colorBase: '#88204a', colorMid: '#d6668c', colorTip: '#f1abc0' },
  { count: 8, radius: 0.18, length: 0.96, width: 0.48, closedTilt: -0.08, openTilt: 0.82, cupClosed: 0.95, cupOpen: 0.6, delay: 0.29, colorBase: '#962a54', colorMid: '#de7699', colorTip: '#f4b7c9' },
  { count: 9, radius: 0.25, length: 1.1, width: 0.56, closedTilt: 0.06, openTilt: 1.06, cupClosed: 0.9, cupOpen: 0.46, delay: 0.2, colorBase: '#a3365e', colorMid: '#e486a4', colorTip: '#f7c3d2' },
  { count: 10, radius: 0.32, length: 1.22, width: 0.62, closedTilt: 0.18, openTilt: 1.26, cupClosed: 0.84, cupOpen: 0.36, delay: 0.12, colorBase: '#ad4268', colorMid: '#e994ad', colorTip: '#f9ccd8' },
  { count: 11, radius: 0.39, length: 1.3, width: 0.68, closedTilt: 0.3, openTilt: 1.42, cupClosed: 0.78, cupOpen: 0.28, delay: 0.05, colorBase: '#b44e71', colorMid: '#ed9fb5', colorTip: '#fbd4de' },
  { count: 12, radius: 0.45, length: 1.34, width: 0.72, closedTilt: 0.42, openTilt: 1.58, cupClosed: 0.7, cupOpen: 0.2, delay: 0, colorBase: '#bb5a7b', colorMid: '#f0a9bd', colorTip: '#fcdae3' },
];

const SEG_U = 20;
const SEG_V = 28;

/**
 * Linha central da pétala, integrada como um arco: o ângulo cresce ao longo do
 * comprimento, então a pétala curva sem esticar. bend > 0 fecha para dentro
 * (botão), bend < 0 vira a ponta para fora (flor aberta).
 */
function centerline(L: number, bend: number, power: number) {
  const ys = [0];
  const zs = [0];
  const phis = [0];
  const ds = L / SEG_V;
  for (let j = 1; j <= SEG_V; j++) {
    const v = (j - 0.5) / SEG_V;
    const phi = bend * Math.pow(v, power);
    ys.push(ys[j - 1] + Math.cos(phi) * ds);
    zs.push(zs[j - 1] - Math.sin(phi) * ds);
    phis.push(bend * Math.pow(j / SEG_V, power));
  }
  return { ys, zs, phis };
}

function petalPoint(
  u: number, v: number, j: number, spec: LayerSpec, line: ReturnType<typeof centerline>,
  open: boolean, seed: number, out: Float32Array, o: number,
) {
  // largura: base estreita (unha da pétala), topo largo e arredondado
  const w = spec.width * Math.pow(Math.sin(Math.PI * Math.min(0.985, 0.04 + v * 0.96)), 0.5) * (0.45 + 0.55 * v);
  const cup = open ? spec.cupOpen : spec.cupClosed;
  // deslocamento para dentro (concavidade) + babado largo e macio na borda superior
  let inward = cup * u * u * w;
  const ruffle = (open ? 0.06 : 0.025) * spec.width;
  inward -= ruffle * (Math.sin(u * 5.2 + seed) + 0.35 * Math.sin(u * 9.5 + seed * 2.3)) * Math.pow(v, 2.2);
  // ponta levemente ondulada (sem dentes: pétala de peônia tem borda macia)
  const notch = 0.022 * spec.length * (0.5 + 0.5 * Math.sin(u * 3.1 + seed * 1.7)) * Math.pow(v, 6);
  const phi = line.phis[j];
  // normal interna da linha central no plano yz
  const ny = -Math.sin(phi);
  const nz = -Math.cos(phi);
  out[o] = u * w;
  out[o + 1] = line.ys[j] + ny * inward - Math.cos(phi) * notch;
  out[o + 2] = line.zs[j] + nz * inward + Math.sin(phi) * notch;
}

function buildPetalGeometry(spec: LayerSpec, layerFrac: number, seed: number) {
  const cols = SEG_U + 1;
  const rows = SEG_V + 1;
  const closed = new Float32Array(cols * rows * 3);
  const opened = new Float32Array(cols * rows * 3);
  const colors = new Float32Array(cols * rows * 3);
  const uvs = new Float32Array(cols * rows * 2);
  const L = spec.length;
  // camadas externas fecham mais (globo) e, abertas, viram mais a ponta para fora
  const lines = {
    closed: centerline(L, 1.05 + 0.75 * layerFrac, 1.4),
    open: centerline(L, -(0.12 + 0.55 * layerFrac), 2.4),
  };
  const cBase = new THREE.Color(spec.colorBase);
  const cMid = new THREE.Color(spec.colorMid);
  const cTip = new THREE.Color(spec.colorTip);
  const c = new THREE.Color();

  for (let j = 0; j < rows; j++) {
    const v = j / SEG_V;
    for (let i = 0; i < cols; i++) {
      const u = (i / SEG_U) * 2 - 1;
      const k = j * cols + i;
      petalPoint(u, v, j, spec, lines.closed, false, seed, closed, k * 3);
      petalPoint(u, v, j, spec, lines.open, true, seed, opened, k * 3);
      // gradiente: base profunda → meio rosé → ponta quase branca; bordas mais claras
      if (v < 0.45) c.copy(cBase).lerp(cMid, Math.pow(v / 0.45, 0.8));
      else c.copy(cMid).lerp(cTip, (v - 0.45) / 0.55);
      c.lerp(cTip, Math.abs(u) * 0.25 * v);
      // veios sutis
      const vein = 0.035 * Math.pow(Math.abs(Math.sin(u * 9)), 6) * (1 - v);
      c.offsetHSL(0, 0, -vein);
      colors.set([c.r, c.g, c.b], k * 3);
      uvs.set([i / SEG_U, v], k * 2);
    }
  }

  const index: number[] = [];
  for (let j = 0; j < SEG_V; j++) {
    for (let i = 0; i < SEG_U; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const d = a + cols;
      const e = d + 1;
      index.push(a, b, d, b, e, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(index);
  geo.setAttribute('position', new THREE.BufferAttribute(closed, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.computeVertexNormals();

  const openGeo = new THREE.BufferGeometry();
  openGeo.setIndex(index);
  openGeo.setAttribute('position', new THREE.BufferAttribute(opened, 3));
  openGeo.computeVertexNormals();

  geo.morphAttributes.position = [openGeo.getAttribute('position')];
  geo.morphAttributes.normal = [openGeo.getAttribute('normal')];
  geo.morphTargetsRelative = false;
  openGeo.dispose();
  geo.computeBoundingSphere();
  return geo;
}

interface Petal {
  hinge: THREE.Object3D;
  mesh: THREE.Mesh;
  layer: number;
  closedTilt: number;
  openTilt: number;
  delay: number;
}

export class Flower {
  readonly group = new THREE.Group();
  private petals: Petal[] = [];
  private stamens: THREE.InstancedMesh;
  private disposables: { dispose(): void }[] = [];

  constructor(quality: 'high' | 'low') {
    this.group.name = 'flower';
    const petalMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.58,
      sheen: 1,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color('#ffd0dc'),
      // brilho próprio baixo e rosado: imita a luz que atravessa a pétala e
      // evita sombras mortas sobre o fundo escuro
      emissive: new THREE.Color('#4a1426'),
      emissiveIntensity: 0.45,
      side: THREE.DoubleSide,
      envMapIntensity: 0.32,
    });
    this.disposables.push(petalMat);

    const rand = mulberry32(7);
    LAYERS.forEach((spec, layerIndex) => {
      // duas variações de geometria por camada para quebrar a repetição
      const frac = layerIndex / (LAYERS.length - 1);
      const geos = [buildPetalGeometry(spec, frac, rand() * 6), buildPetalGeometry(spec, frac, rand() * 6)];
      this.disposables.push(...geos);
      const angleOffset = layerIndex * 0.61;
      for (let n = 0; n < spec.count; n++) {
        const theta = angleOffset + (n / spec.count) * Math.PI * 2 + (rand() - 0.5) * 0.18;
        const pivot = new THREE.Object3D();
        pivot.rotation.y = theta;
        pivot.position.set(Math.sin(theta) * spec.radius, layerIndex * -0.018, Math.cos(theta) * spec.radius);
        const hinge = new THREE.Object3D();
        const mesh = new THREE.Mesh(geos[n % 2], petalMat);
        mesh.morphTargetInfluences = [0];
        const s = 0.88 + rand() * 0.22;
        mesh.scale.setScalar(s);
        mesh.rotation.z = (rand() - 0.5) * 0.2;
        mesh.castShadow = quality === 'high';
        mesh.receiveShadow = quality === 'high';
        hinge.add(mesh);
        pivot.add(hinge);
        this.group.add(pivot);
        this.petals.push({
          hinge,
          mesh,
          layer: layerIndex,
          closedTilt: spec.closedTilt + (rand() - 0.5) * 0.08,
          openTilt: spec.openTilt + (rand() - 0.5) * 0.22,
          delay: spec.delay,
        });
      }
    });

    // estames dourados no centro: aparecem quando a flor abre
    const stamenGeo = new THREE.CapsuleGeometry(0.012, 0.16, 3, 6);
    stamenGeo.translate(0, 0.08, 0);
    const stamenMat = new THREE.MeshStandardMaterial({ color: '#e7c27d', roughness: 0.45, metalness: 0.25 });
    this.disposables.push(stamenGeo, stamenMat);
    const count = 70;
    this.stamens = new THREE.InstancedMesh(stamenGeo, stamenMat, count);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = 0.03 + Math.sqrt(rand()) * 0.13;
      e.set(Math.cos(a) * r * 3.2, 0, -Math.sin(a) * r * 3.2);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(Math.sin(a) * r, 0.02, Math.cos(a) * r), q, new THREE.Vector3(1, 0.7 + rand() * 0.6, 1));
      this.stamens.setMatrixAt(i, m);
    }
    this.group.add(this.stamens);

    // sépalas e haste curta em verde acinzentado
    const sepalMat = new THREE.MeshStandardMaterial({ color: '#6f7c5c', roughness: 0.75, side: THREE.DoubleSide, envMapIntensity: 0.4 });
    const sepalGeo = new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.42);
    sepalGeo.scale(1, 0.7, 1);
    sepalGeo.rotateX(Math.PI);
    const receptacle = new THREE.Mesh(sepalGeo, sepalMat);
    receptacle.position.y = 0.07;
    const stemGeo = new THREE.CylinderGeometry(0.032, 0.045, 2.4, 12);
    stemGeo.translate(0, -1.32, 0);
    const stem = new THREE.Mesh(stemGeo, sepalMat);
    this.group.add(receptacle, stem);
    this.disposables.push(sepalMat, sepalGeo, stemGeo);

    this.setOpen(0);
  }

  /** 0 = botão fechado, 1 = flor totalmente aberta */
  setOpen(t: number) {
    for (const p of this.petals) {
      const local = smoothstep(clamp01((t - p.delay) / (1 - p.delay * 0.9)));
      p.hinge.rotation.x = THREE.MathUtils.lerp(p.closedTilt, p.openTilt, local);
      p.mesh.morphTargetInfluences![0] = local;
    }
    const s = smoothstep(clamp01((t - 0.35) / 0.65));
    this.stamens.scale.setScalar(0.4 + 0.6 * s);
    this.stamens.position.y = -0.05 + 0.05 * s;
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.stamens.dispose();
  }
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}
function smoothstep(x: number) {
  return x * x * (3 - 2 * x);
}
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
