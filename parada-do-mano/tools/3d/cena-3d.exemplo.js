// Parada do Mano — EXEMPLO de cena 3D (não usado no site; ver LEIA-ME.md).
//
// Carrega um modelo .glb num contêiner [data-cena-3d] e o gira conforme a rolagem,
// usando o mesmo relógio do GSAP (um único laço de animação na página).
// Pressupõe: gsap e ScrollTrigger já carregados (cinema.js), e os módulos do
// Three.js copiados para assets/js/vendor/ por tools/vendor.py.
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

export async function montar(container) {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const url = container.getAttribute('data-cena-3d');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 6);
  // luz quente de brasa por baixo + luz de recorte fria, na paleta do site
  cena.add(new THREE.HemisphereLight(0xfff3e2, 0x17110d, 0.6));
  const brasa = new THREE.PointLight(0xff821c, 30, 12);
  brasa.position.set(-1.5, -2, 2);
  cena.add(brasa);
  const recorte = new THREE.DirectionalLight(0xffffff, 1.2);
  recorte.position.set(3, 4, 2);
  cena.add(recorte);

  const gltf = await new GLTFLoader().loadAsync(url);
  const modelo = gltf.scene;
  cena.add(modelo);

  const medir = () => {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  medir();
  const ro = new ResizeObserver(medir);
  ro.observe(container);

  // a rolagem só muda números; o desenho acontece no tick do GSAP, se estiver visível
  const estado = { giro: 0, inclinacao: 0.15 };
  const st = gsap.to(estado, {
    giro: Math.PI * 1.5, inclinacao: -0.1, ease: 'none',
    scrollTrigger: { trigger: container, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
  });
  let visivel = false;
  const io = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; });
  io.observe(container);
  const desenhar = () => {
    if (!visivel || document.hidden) return;
    modelo.rotation.y = estado.giro;
    modelo.rotation.x = estado.inclinacao;
    renderer.render(cena, camera);
  };
  gsap.ticker.add(desenhar);

  // limpeza (troca de página, movimento reduzido ligado durante a visita)
  return function desmontar() {
    gsap.ticker.remove(desenhar);
    st.scrollTrigger && st.scrollTrigger.kill();
    st.kill();
    io.disconnect();
    ro.disconnect();
    cena.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => { Object.values(m).forEach((v) => v && v.isTexture && v.dispose()); m.dispose(); });
    });
    renderer.dispose();
    renderer.domElement.remove();
    ScrollTrigger && ScrollTrigger.refresh();
  };
}
