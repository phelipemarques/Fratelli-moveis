import * as THREE from 'three';
import { Flower } from './flower';
import { Polish } from './polish';

export type Quality = 'high' | 'low';

/** Estado animável da cena. O GSAP escreve aqui; a Stage lê a cada quadro. */
export interface SceneState {
  // câmera (posição e alvo)
  camX: number; camY: number; camZ: number;
  tgtX: number; tgtY: number; tgtZ: number;
  /** deslocamento da composição em frações da tela (texto à esquerda no desktop) */
  shiftX: number;
  // flor
  bloom: number;
  flowerY: number;
  flowerScale: number;
  flowerSpin: number;
  // esmalte
  polishY: number;
  polishScale: number;
  polishRotX: number;
  polishRotY: number;
  polishRotZ: number;
  capTurns: number;
  capLift: number;
  capTiltX: number;
  capTiltZ: number;
  capShiftX: number;
  dropSize: number;
  // luz e fundo
  mood: number;
  keyWarmth: number;
}

export const initialState = (): SceneState => ({
  camX: 0, camY: 0.95, camZ: 6.4,
  tgtX: 0, tgtY: 0.62, tgtZ: 0,
  shiftX: 0.2,
  bloom: 0,
  flowerY: 0,
  flowerScale: 1,
  flowerSpin: 0,
  polishY: 0.62,
  polishScale: 0.42,
  polishRotX: 0,
  polishRotY: 0,
  polishRotZ: 0,
  capTurns: 0,
  capLift: 0,
  capTiltX: 0,
  capTiltZ: 0,
  capShiftX: 0,
  dropSize: 0,
  mood: 0,
  keyWarmth: 0,
});

// fundos de cada momento: [topo, base, brilho]
const MOODS: [string, string, string][] = [
  ['#f6e7e4', '#efd6d6', '#fff7f2'], // manhã rosé
  ['#f3dfe0', '#e9c6cc', '#fff3f0'], // flor aberta
  ['#efe3dc', '#e2cfc7', '#fffaf3'], // champagne
  ['#f4ebe4', '#ead9d2', '#fffdf8'], // off-white quente
];

const BG_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;
const BG_FRAG = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uGlow;
  uniform vec2 uGlowPos;
  uniform float uAspect;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
    vec2 d = (vUv - uGlowPos) * vec2(uAspect, 1.0);
    col = mix(col, uGlow, smoothstep(0.75, 0.0, length(d)) * 0.85);
    float vig = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(uAspect * 0.8, 1.0)));
    col *= mix(0.93, 1.0, vig);
    col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  readonly state = initialState();
  readonly flower: Flower;
  readonly polish: Polish;
  private bgMat: THREE.ShaderMaterial;
  private key: THREE.DirectionalLight;
  private fill: THREE.DirectionalLight;
  private rim: THREE.DirectionalLight;
  private envRT: THREE.WebGLRenderTarget;
  private width = 1;
  private height = 1;
  private dirty = true;
  private floatTime = 0;
  floatEnabled = true;
  private colA = new THREE.Color();
  private colB = new THREE.Color();
  private warmKey = new THREE.Color('#fff1e0');
  private coolKey = new THREE.Color('#ffffff');

  constructor(readonly canvas: HTMLCanvasElement, readonly quality: Quality) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality === 'high',
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = quality === 'high';
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // reflexos de estúdio sem baixar HDR: ambiente procedural pré-filtrado
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const studio = studioEnvironment();
    this.envRT = pmrem.fromScene(studio, 0.02);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = 0.9;
    pmrem.dispose();
    studio.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });

    // fundo: quad em tela cheia (entra no passe de transmissão do vidro)
    this.bgMat = new THREE.ShaderMaterial({
      vertexShader: BG_VERT,
      fragmentShader: BG_FRAG,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTop: { value: new THREE.Color() },
        uBottom: { value: new THREE.Color() },
        uGlow: { value: new THREE.Color() },
        uGlowPos: { value: new THREE.Vector2(0.62, 0.55) },
        uAspect: { value: 1 },
      },
    });
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bgMat);
    bg.frustumCulled = false;
    bg.renderOrder = -1000;
    this.scene.add(bg);

    // iluminação de estúdio: principal, preenchimento rosado e contraluz
    this.key = new THREE.DirectionalLight('#fff1e0', 2.8);
    this.key.position.set(-3.2, 5.5, 4.2);
    this.key.castShadow = quality === 'high';
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.camera.near = 1;
    this.key.shadow.camera.far = 16;
    Object.assign(this.key.shadow.camera, { left: -2.6, right: 2.6, top: 3.2, bottom: -2.2 });
    this.key.shadow.bias = -0.0006;
    this.key.shadow.normalBias = 0.025;
    this.key.shadow.radius = 4;
    this.fill = new THREE.DirectionalLight('#ffd9e2', 0.9);
    this.fill.position.set(4, 1.5, 3);
    this.rim = new THREE.DirectionalLight('#ffffff', 1.6);
    this.rim.position.set(1.5, 3, -5);
    const hemi = new THREE.HemisphereLight('#fff6f3', '#d9a9b6', 0.35);
    this.scene.add(this.key, this.key.target, this.fill, this.rim, hemi);

    this.flower = new Flower(quality);
    this.polish = new Polish({ liquid: '#a3284f', name: 'Rosé' }, quality);
    this.scene.add(this.flower.group, this.polish.root);
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    const maxDpr = this.quality === 'high' ? 2 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.bgMat.uniforms.uAspect.value = w / h;
    this.invalidate();
  }

  invalidate() {
    this.dirty = true;
  }

  /** afastamento extra da câmera em telas verticais, para a composição caber */
  private framing() {
    const a = this.width / this.height;
    return a >= 1.25 ? 1 : 1 + (1.25 - a) * 0.95;
  }

  private apply(dt: number) {
    const s = this.state;
    const f = this.framing();
    const portrait = this.width / this.height < 1;

    // câmera
    const cam = this.camera;
    cam.position.set(
      s.tgtX + (s.camX - s.tgtX) * f,
      s.tgtY + (s.camY - s.tgtY) * f,
      s.tgtZ + (s.camZ - s.tgtZ) * f,
    );
    cam.lookAt(s.tgtX, s.tgtY, s.tgtZ);
    cam.fov = portrait ? 36 : 32;
    // composição: no desktop o objeto fica à direita do texto; no mobile, centralizado e um pouco acima
    const sx = portrait ? 0 : s.shiftX;
    const sy = portrait ? 0.07 : 0;
    cam.setViewOffset(this.width, this.height, -sx * this.width, sy * this.height, this.width, this.height);
    cam.updateProjectionMatrix();

    // flor
    this.flower.setOpen(s.bloom);
    this.flower.group.position.y = s.flowerY;
    this.flower.group.scale.setScalar(s.flowerScale);
    this.flower.group.rotation.y = s.flowerSpin;

    // esmalte
    const p = this.polish;
    p.root.position.y = s.polishY;
    p.root.scale.setScalar(s.polishScale);
    p.root.rotation.set(s.polishRotX, s.polishRotY, s.polishRotZ);
    p.setUnscrew(s.capTurns, s.capLift);
    p.capPivot.rotation.x = s.capTiltX;
    p.capPivot.rotation.z = s.capTiltZ;
    p.capPivot.position.x = s.capShiftX;
    p.drop.scale.set(Math.max(0.001, s.dropSize), Math.max(0.001, s.dropSize * (1 + s.dropSize * 0.35)), Math.max(0.001, s.dropSize));

    // flutuação sutil (somada, não substitui a timeline)
    if (this.floatEnabled) {
      this.floatTime += dt;
      const amt = Math.min(1, s.polishScale) * (1 - Math.min(1, s.capLift * 2) * 0.6);
      p.float.position.y = Math.sin(this.floatTime * 1.1) * 0.025 * amt;
      p.float.rotation.z = Math.sin(this.floatTime * 0.7) * 0.012 * amt;
    }

    // luz e fundo
    this.key.color.copy(this.coolKey).lerp(this.warmKey, s.keyWarmth);
    this.key.intensity = 2.6 + s.keyWarmth * 0.5;
    const i = Math.min(MOODS.length - 1.0001, Math.max(0, s.mood));
    const i0 = Math.floor(i);
    const t = i - i0;
    const u = this.bgMat.uniforms;
    (['uTop', 'uBottom', 'uGlow'] as const).forEach((k, n) => {
      this.colA.set(MOODS[i0][n]);
      this.colB.set(MOODS[i0 + 1][n]);
      (u[k].value as THREE.Color).copy(this.colA).lerp(this.colB, t);
    });
    (u.uGlowPos.value as THREE.Vector2).set(portrait ? 0.5 : 0.5 + s.shiftX * 0.6, portrait ? 0.6 : 0.55);
  }

  /** desenha só quando algo mudou, ou continuamente enquanto a flutuação estiver ligada */
  frame(dt: number) {
    if (!this.dirty && !this.floatEnabled) return false;
    this.apply(dt);
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
    return true;
  }

  dispose() {
    this.flower.dispose();
    this.polish.dispose();
    this.bgMat.dispose();
    this.envRT.dispose();
    this.renderer.dispose();
  }
}

/**
 * Estúdio para os reflexos: cúpula rosada clara e softboxes em faixa.
 * As faixas verticais desenham os brilhos longos no vidro e na tampa.
 */
function studioEnvironment() {
  const env = new THREE.Scene();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#e9d3d1').multiplyScalar(0.85), side: THREE.BackSide }),
  );
  env.add(dome);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#c9a6a8').multiplyScalar(0.6) }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4;
  env.add(floor);
  const panel = (w: number, h: number, color: string, power: number, pos: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(1.4, 7, '#ffffff', 6, [-5.5, 1, 3.5]); // faixa principal, esquerda
  panel(0.8, 6, '#ffe6ee', 3.5, [5.5, 0.5, 2.5]); // faixa rosada, direita
  panel(5, 3, '#fff6ec', 3, [0, 7, 1]); // teto
  panel(2, 6, '#ffffff', 2.5, [1.5, 1, -6]); // contraluz
  return env;
}
