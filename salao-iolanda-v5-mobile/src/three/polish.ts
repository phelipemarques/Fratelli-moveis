import * as THREE from 'three';

/**
 * Frasco de esmalte procedural, montado em partes independentes:
 * bottle (vidro), liquid, label, neckThread e o conjunto capPivot,
 * que carrega cap + applicatorStem + brush + drop.
 *
 * Tampa e aplicador compartilham o mesmo pivô, então desenroscar, erguer e
 * inclinar a tampa leva o pincel junto, sem saltos. O pivô fica no topo do
 * gargalo; o pincel só pode inclinar depois que a ponta passa da boca do
 * frasco (ver BRUSH_CLEARANCE), o que impede o aplicador de atravessar o vidro.
 */

const NECK_TOP = 1.035;
const BRUSH_TIP_Y = 0.16; // ponta do pincel, em coordenadas do frasco
/** quanto o pivô precisa subir para a ponta do pincel sair da boca */
export const BRUSH_CLEARANCE = NECK_TOP - BRUSH_TIP_Y + 0.06;
/** passo da rosca por volta */
export const THREAD_PITCH = 0.028;
/** centro visual do frasco, usado como eixo de rotação */
const CENTER_Y = 0.78;

export interface PolishShade {
  liquid: string;
  name: string;
}

export class Polish {
  /** raiz: posição, escala e rotação de apresentação */
  readonly root = new THREE.Group();
  /** flutuação sutil, somada à animação principal */
  readonly float = new THREE.Group();
  readonly bottle = new THREE.Group();
  readonly capPivot = new THREE.Group();
  readonly cap: THREE.Mesh;
  readonly liquid: THREE.Mesh;
  readonly applicatorStem: THREE.Mesh;
  readonly brush: THREE.Mesh;
  readonly drop: THREE.Mesh;
  readonly glass: THREE.MeshPhysicalMaterial;
  private disposables: { dispose(): void }[] = [];

  constructor(shade: PolishShade, quality: 'high' | 'low') {
    this.root.name = 'polish';
    this.root.add(this.float);
    this.float.add(this.bottle);
    this.bottle.position.y = -CENTER_Y;

    // ---------- vidro ----------
    // corpo oval: torneado e achatado em z, para que a rotação revele faces diferentes
    const body = new THREE.Group();
    body.scale.set(1, 1, 0.72);
    this.bottle.add(body);

    // corpo: perfil suavizado por spline (sem quinas no ombro); gargalo com cantos vivos
    const body2d = new THREE.SplineCurve(
      [
        [0.3, 0], [0.395, 0.012], [0.42, 0.045], [0.428, 0.1], [0.43, 0.6],
        [0.422, 0.68], [0.395, 0.75], [0.33, 0.815], [0.23, 0.855], [0.15, 0.875], [0.122, 0.89],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    ).getPoints(quality === 'high' ? 72 : 40);
    const outer = [
      new THREE.Vector2(0, 0),
      ...body2d,
      ...[[0.12, 1.02], [0.124, 1.03], [0.118, NECK_TOP], [0.088, NECK_TOP], [0.084, 1.0], [0.084, 0.93], [0, 0.93]]
        .map(([x, y]) => new THREE.Vector2(x, y)),
    ];
    const glassGeo = new THREE.LatheGeometry(outer, quality === 'high' ? 128 : 64);
    this.glass = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      metalness: 0,
      roughness: 0.035,
      transmission: 1,
      thickness: 0.6,
      ior: 1.5,
      attenuationColor: new THREE.Color('#ffeef2'),
      attenuationDistance: 2.4,
      specularIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.25,
    });
    const glassMesh = new THREE.Mesh(glassGeo, this.glass);
    glassMesh.name = 'bottle';
    glassMesh.castShadow = quality === 'high';
    body.add(glassMesh);

    // ---------- líquido ----------
    // líquido com cantos arredondados e um menisco leve no topo
    const inner = [
      new THREE.Vector2(0, 0.1),
      ...new THREE.SplineCurve(
        [[0.3, 0.1], [0.355, 0.115], [0.374, 0.15], [0.38, 0.22], [0.38, 0.58], [0.372, 0.603]].map(([x, y]) => new THREE.Vector2(x, y)),
      ).getPoints(24),
      new THREE.Vector2(0.2, 0.598),
      new THREE.Vector2(0, 0.596),
    ];
    const liquidGeo = new THREE.LatheGeometry(inner, quality === 'high' ? 80 : 48);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: shade.liquid,
      roughness: 0.32,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      sheen: 0.5,
      sheenColor: new THREE.Color('#e46f95'),
      envMapIntensity: 0.6,
    });
    this.liquid = new THREE.Mesh(liquidGeo, liquidMat);
    this.liquid.name = 'liquid';
    body.add(this.liquid);

    // ---------- rótulo ----------
    const labelTex = makeLabelTexture(shade.name);
    const labelGeo = new THREE.CylinderGeometry(0.4335, 0.4335, 0.3, 64, 1, true, -0.66, 1.32);
    const labelMat = new THREE.MeshStandardMaterial({
      map: labelTex,
      transparent: true,
      color: '#ffffff',
      metalness: 0.55,
      roughness: 0.32,
      envMapIntensity: 1.4,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.y = 0.33;
    label.name = 'label';
    body.add(label);

    // ---------- rosca do gargalo ----------
    const helix = new THREE.CatmullRomCurve3(
      Array.from({ length: 60 }, (_, i) => {
        const t = i / 59;
        const a = t * Math.PI * 2 * 2.2;
        return new THREE.Vector3(Math.sin(a) * 0.123, 0.925 + t * 0.085, Math.cos(a) * 0.123);
      }),
    );
    const threadGeo = new THREE.TubeGeometry(helix, 120, 0.0055, 6, false);
    const threadMat = new THREE.MeshPhysicalMaterial({ color: '#f6efea', roughness: 0.35, clearcoat: 0.6 });
    const thread = new THREE.Mesh(threadGeo, threadMat);
    thread.name = 'neckThread';
    this.bottle.add(thread);

    // ---------- tampa + aplicador (mesmo pivô) ----------
    this.capPivot.position.y = NECK_TOP;
    this.capPivot.name = 'capPivot';
    this.bottle.add(this.capPivot);

    const capProfile = [
      [0, -0.005], [0.105, -0.005], [0.105, -0.15], [0.152, -0.15], [0.16, -0.142],
      [0.162, -0.12], [0.162, 0.45], [0.158, 0.478], [0.146, 0.494], [0.12, 0.5], [0, 0.5],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const capGeo = new THREE.LatheGeometry(capProfile, quality === 'high' ? 192 : 96);
    addGrooves(capGeo, 48, 0.157, -0.13, 0.44);
    // tampa preta laqueada, como a base da marca, com reflexo bordô bem leve
    const capMat = new THREE.MeshPhysicalMaterial({
      color: '#151012',
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      sheen: 0.35,
      sheenColor: new THREE.Color('#7e2338'),
      envMapIntensity: 1.25,
      side: THREE.DoubleSide,
    });
    this.cap = new THREE.Mesh(capGeo, capMat);
    this.cap.name = 'cap';
    this.cap.castShadow = quality === 'high';
    this.capPivot.add(this.cap);

    const ringGeo = new THREE.TorusGeometry(0.159, 0.0075, 10, 96);
    ringGeo.rotateX(Math.PI / 2);
    const goldMat = new THREE.MeshStandardMaterial({ color: '#d9b98a', metalness: 1, roughness: 0.22, envMapIntensity: 1.3 });
    const ring = new THREE.Mesh(ringGeo, goldMat);
    ring.position.y = -0.146;
    this.capPivot.add(ring);

    // haste: do teto interno da tampa até a base do pincel
    const stemTop = -0.005;
    const stemBottom = BRUSH_TIP_Y + 0.17 - NECK_TOP;
    const stemGeo = new THREE.CylinderGeometry(0.016, 0.019, stemTop - stemBottom, 16);
    stemGeo.translate(0, (stemTop + stemBottom) / 2, 0);
    const stemMat = new THREE.MeshPhysicalMaterial({ color: '#f3ece8', roughness: 0.3, clearcoat: 0.5 });
    this.applicatorStem = new THREE.Mesh(stemGeo, stemMat);
    this.applicatorStem.name = 'applicatorStem';
    this.capPivot.add(this.applicatorStem);

    // pincel achatado em leque, coberto de esmalte molhado
    const brushProfile = [
      [0, 0.17], [0.024, 0.17], [0.03, 0.13], [0.04, 0.07], [0.046, 0.035], [0.045, 0.014], [0.034, 0.003], [0.016, 0], [0, 0],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const brushGeo = new THREE.LatheGeometry(brushProfile, 32);
    brushGeo.scale(1.55, 1, 0.34);
    const wetMat = new THREE.MeshPhysicalMaterial({
      color: shade.liquid,
      roughness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.2,
    });
    this.brush = new THREE.Mesh(brushGeo, wetMat);
    this.brush.position.y = BRUSH_TIP_Y - NECK_TOP;
    this.brush.name = 'brush';
    this.capPivot.add(this.brush);

    const dropGeo = new THREE.SphereGeometry(0.03, 20, 14);
    dropGeo.translate(0, -0.028, 0);
    this.drop = new THREE.Mesh(dropGeo, wetMat);
    this.drop.position.y = BRUSH_TIP_Y - NECK_TOP + 0.006;
    this.drop.scale.setScalar(0.001);
    this.drop.name = 'drop';
    this.capPivot.add(this.drop);

    this.disposables.push(
      glassGeo, this.glass, liquidGeo, liquidMat, labelTex, labelGeo, labelMat, threadGeo, threadMat,
      capGeo, capMat, ringGeo, goldMat, stemGeo, stemMat, brushGeo, wetMat, dropGeo,
    );
  }

  /** desenroscar: voltas completas, com subida proporcional ao passo da rosca */
  setUnscrew(turns: number, lift: number) {
    this.capPivot.rotation.y = turns * Math.PI * 2;
    this.capPivot.position.y = NECK_TOP + turns * THREAD_PITCH + lift;
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}

/** frisos verticais na tampa, deslocando o raio dos vértices da lateral */
function addGrooves(geo: THREE.BufferGeometry, count: number, minR: number, y0: number, y1: number) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < minR || y < y0 || y > y1) continue;
    const a = Math.atan2(x, z);
    const k = 1 - 0.018 * Math.pow(0.5 + 0.5 * Math.cos(a * count), 3);
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  geo.computeVertexNormals();
}

function makeLabelTexture(shadeName: string) {
  const c = document.createElement('canvas');
  // proporção da faixa do rótulo: 0,57 de largura por 0,30 de altura
  c.width = 1024;
  c.height = 540;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = '#f4e4c9';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'italic 300px "Instrument Serif", Georgia, serif';
  g.fillText(shadeName, 512, 220);
  g.fillRect(452, 382, 120, 3);
  g.font = '600 40px "Manrope Variable", system-ui, sans-serif';
  if ('letterSpacing' in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '14px';
  g.fillText('ESMALTE · Nº 01', 518, 450);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
