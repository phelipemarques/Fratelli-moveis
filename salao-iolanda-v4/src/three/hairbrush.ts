import * as THREE from 'three';

/**
 * Escova redonda térmica, procedural: cabo laqueado preto, anel dourado,
 * tambor cerâmico rosé e cerdas em fileiras alternadas (InstancedMesh: duas
 * chamadas de desenho para centenas de cerdas). Liga a abertura ao universo
 * dos serviços de cabelo. Eixo longo em Y, pivô no centro.
 */
const BARREL_R = 0.17;
const BARREL_Y0 = 1.02;
const BARREL_Y1 = 2.02;
const LENGTH = 2.1;

export class Hairbrush {
  readonly root = new THREE.Group();
  /** giro em torno do eixo longo (as cerdas passam diante da câmera) */
  readonly spin = new THREE.Group();
  private disposables: { dispose(): void }[] = [];

  constructor(quality: 'high' | 'low') {
    this.root.name = 'hairbrush';
    this.root.add(this.spin);
    const body = new THREE.Group();
    body.position.y = -LENGTH / 2;
    this.spin.add(body);
    const seg = quality === 'high' ? 64 : 32;

    // cabo: perfil afinando para a pega, com bojo na ponta
    const handlePts = new THREE.SplineCurve(
      [[0.0, 0], [0.085, 0.01], [0.105, 0.06], [0.092, 0.2], [0.075, 0.45], [0.08, 0.72], [0.105, 0.9], [0.118, 0.97]]
        .map(([x, y]) => new THREE.Vector2(x, y)),
    ).getPoints(48);
    handlePts.push(new THREE.Vector2(0, 0.97));
    const handleGeo = new THREE.LatheGeometry(handlePts, seg);
    const lacquer = new THREE.MeshPhysicalMaterial({
      color: '#141013', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3,
    });
    body.add(new THREE.Mesh(handleGeo, lacquer));

    // filete bordô e anel dourado
    const wineMat = new THREE.MeshPhysicalMaterial({ color: '#7e2338', roughness: 0.3, clearcoat: 0.8, envMapIntensity: 1 });
    const stripeGeo = new THREE.TorusGeometry(0.094, 0.006, 8, seg);
    stripeGeo.rotateX(Math.PI / 2);
    const stripe = new THREE.Mesh(stripeGeo, wineMat);
    stripe.position.y = 0.2;
    body.add(stripe);
    const goldMat = new THREE.MeshStandardMaterial({ color: '#d5bea5', metalness: 1, roughness: 0.2, envMapIntensity: 1.4 });
    const collarGeo = new THREE.CylinderGeometry(0.128, 0.122, 0.07, seg);
    const collar = new THREE.Mesh(collarGeo, goldMat);
    collar.position.y = BARREL_Y0 - 0.02;
    body.add(collar);

    // tambor cerâmico com ponta arredondada
    const barrelPts = [
      new THREE.Vector2(0, BARREL_Y0), new THREE.Vector2(BARREL_R, BARREL_Y0),
      ...new THREE.SplineCurve(
        [[BARREL_R, BARREL_Y1 - 0.1], [BARREL_R * 0.92, BARREL_Y1 - 0.02], [BARREL_R * 0.5, BARREL_Y1 + 0.03], [0, BARREL_Y1 + 0.04]]
          .map(([x, y]) => new THREE.Vector2(x, y)),
      ).getPoints(16),
    ];
    const barrelGeo = new THREE.LatheGeometry(barrelPts, seg);
    const ceramic = new THREE.MeshPhysicalMaterial({
      color: '#c98f9d', metalness: 0.55, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.1,
    });
    body.add(new THREE.Mesh(barrelGeo, ceramic));

    // cerdas: fileiras ao longo do tambor, alternando o ângulo
    const rows = quality === 'high' ? 18 : 12;
    const around = quality === 'high' ? 18 : 12;
    const count = rows * around;
    const bristleLen = 0.16;
    const bristleGeo = new THREE.CylinderGeometry(0.0065, 0.0075, bristleLen, 5, 1, true);
    bristleGeo.translate(0, bristleLen / 2, 0);
    const bristleMat = new THREE.MeshStandardMaterial({ color: '#efe6e0', roughness: 0.45, envMapIntensity: 0.8 });
    const tipGeo = new THREE.SphereGeometry(0.0135, 8, 6);
    const tipMat = new THREE.MeshStandardMaterial({ color: '#7e2338', roughness: 0.35, envMapIntensity: 0.9 });
    const bristles = new THREE.InstancedMesh(bristleGeo, bristleMat, count);
    const tips = new THREE.InstancedMesh(tipGeo, tipMat, count);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const one = new THREE.Vector3(1, 1, 1);
    let k = 0;
    for (let r = 0; r < rows; r++) {
      const y = BARREL_Y0 + 0.08 + (r / (rows - 1)) * (BARREL_Y1 - BARREL_Y0 - 0.18);
      for (let a = 0; a < around; a++) {
        const ang = ((a + (r % 2) * 0.5) / around) * Math.PI * 2;
        dir.set(Math.sin(ang), 0, Math.cos(ang));
        q.setFromUnitVectors(up, dir);
        pos.set(dir.x * BARREL_R * 0.96, y, dir.z * BARREL_R * 0.96);
        m.compose(pos, q, one);
        bristles.setMatrixAt(k, m);
        pos.addScaledVector(dir, bristleLen);
        m.compose(pos, q, one);
        tips.setMatrixAt(k, m);
        k++;
      }
    }
    body.add(bristles, tips);

    this.disposables.push(
      handleGeo, lacquer, wineMat, stripeGeo, goldMat, collarGeo, barrelGeo, ceramic,
      bristleGeo, bristleMat, tipGeo, tipMat, bristles, tips,
    );
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}
