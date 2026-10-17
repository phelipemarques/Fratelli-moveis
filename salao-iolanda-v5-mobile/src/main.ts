import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/manrope';
import './styles/main.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initNav } from './site/nav';
import { initTheme } from './site/theme';
import { initMotion } from './site/motion';
import { initServices } from './site/services';
import { initPortfolio } from './site/portfolio';
import { initMobileBar } from './site/mbar';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
const forceFallback = new URLSearchParams(location.search).has('sem-webgl');

// o site comercial não depende do 3D: liga já, antes de qualquer WebGL
initNav();
initServices();
initPortfolio();
initMobileBar();
initTheme();
initMotion();

function hasWebGL2() {
  if (forceFallback) return false;
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

/** aparelhos modestos: menos sombra, menos DPR, sem antialias */
function pickQuality(): 'high' | 'low' {
  const forced = new URLSearchParams(location.search).get('q');
  if (forced === 'high' || forced === 'low') return forced;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (saveData) return 'low';
  if ((nav.deviceMemory ?? 8) < 4) return 'low';
  if ((navigator.hardwareConcurrency ?? 8) < 4) return 'low';
  return coarse && window.innerWidth < 700 ? 'low' : 'high';
}

function showFallback() {
  root.classList.add('is-static', 'no-webgl');
  const fb = document.querySelector<HTMLElement>('.cinema__fallback')!;
  fb.hidden = false;
  fb.querySelector('img')?.setAttribute('loading', 'eager');
  document.querySelector('.cinema__canvas')?.remove();
}

async function start() {
  if (!hasWebGL2()) {
    showFallback();
    return;
  }

  // o rótulo do frasco é desenhado em canvas: as fontes precisam estar prontas
  await Promise.race([
    Promise.all([
      document.fonts.load('italic 112px "Instrument Serif"'),
      document.fonts.load('600 26px "Manrope Variable"'),
    ]),
    new Promise((r) => setTimeout(r, 1500)),
  ]);

  const [{ Stage }, { buildTimeline, addChapters, MARKS, STILL_TIME }] = await Promise.all([
    import('./three/stage'),
    import('./motion/timeline'),
  ]);

  const canvas = document.querySelector<HTMLCanvasElement>('.cinema__canvas')!;
  let stage: InstanceType<typeof Stage>;
  try {
    const dpr = Number(new URLSearchParams(location.search).get('dpr')) || undefined;
    stage = new Stage(canvas, pickQuality(), dpr);
  } catch (err) {
    console.error('[cinema] WebGL indisponível, usando imagem estática.', err);
    showFallback();
    return;
  }
  await stage.warmup().catch((err) => console.warn('[cinema] pré-compilação falhou', err));
  root.classList.add('webgl-ready');

  const cinema = document.querySelector<HTMLElement>('.cinema')!;
  const stageEl = document.querySelector<HTMLElement>('.cinema__stage')!;
  const bar = document.querySelector<HTMLElement>('.cinema__progress span')!;

  const resize = () => stage.resize(stageEl.clientWidth, stageEl.clientHeight);
  resize();
  new ResizeObserver(resize).observe(stageEl);

  const tl = buildTimeline(stage.state, () => stage.invalidate());
  addChapters(tl);
  tl.to(bar, { scaleX: 1, duration: tl.duration(), ease: 'none' }, 0);

  // renderiza só quando a seção está na tela e a aba está visível
  let onScreen = true;
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen) stage.invalidate();
  }).observe(cinema);

  let trigger: ScrollTrigger | null = null;

  const applyMotionMode = () => {
    const still = reducedMotion.matches;
    root.classList.toggle('is-static', still);
    root.classList.toggle('reduced-motion', still);
    trigger?.kill();
    trigger = null;
    if (still) {
      // apresentação simplificada: um único quadro, o esmalte saindo da flor
      stage.floatEnabled = false;
      tl.seek(STILL_TIME);
      gsap.set('[data-chapter]', { clearProps: 'all' });
      gsap.set('[data-chapter="0"] .line > span, [data-chapter="0"] [data-fade]', { clearProps: 'all' });
    } else {
      stage.floatEnabled = pickQuality() === 'high' && !saveData;
      trigger = ScrollTrigger.create({
        trigger: cinema,
        start: 'top top',
        end: 'bottom bottom',
        // no toque a resposta ao dedo precisa ser mais direta que na roda do mouse
        scrub: matchMedia('(pointer: coarse)').matches ? 0.45 : 0.8,
        animation: tl,
        invalidateOnRefresh: false,
      });
    }
    stage.invalidate();
    ScrollTrigger.refresh();
  };
  applyMotionMode();
  reducedMotion.addEventListener('change', applyMotionMode);

  // um único laço: o ticker do GSAP (o mesmo que move a timeline)
  // taxa de quadros real: se, desenhando sem parar, a média passar de ~40 ms
  // (abaixo de 25 qps), a cena baixa a resolução em degraus
  let ema = 16;
  let samples = 0;
  let lastDrew = false;
  gsap.ticker.add((_time, deltaMs) => {
    if (!onScreen || document.hidden) return;
    if (lastDrew && deltaMs < 250) {
      ema = ema * 0.9 + deltaMs * 0.1;
      if (++samples > 45 && ema > 40) {
        samples = 0;
        ema = 16;
        if (stage.degrade()) console.info('[cinema] resolução reduzida para', stage.pixelRatio);
      }
    }
    lastDrew = stage.frame(Math.min(deltaMs, 50) / 1000);
  });

  // ganchos para os testes automatizados
  Object.assign(window, {
    __cinema: {
      timeline: tl,
      state: stage.state,
      marks: MARKS,
      stillTime: STILL_TIME,
      render: () => {
        stage.invalidate();
        stage.frame(0);
      },
      info: () => ({ ...stage.renderer.info.render, pixelRatio: stage.pixelRatio }),
      bounds: () => stage.bounds(),
      setFloat: (on: boolean) => {
        stage.floatEnabled = on;
        stage.invalidate();
      },
    },
  });
}

start().catch((err) => {
  console.error('[cinema] falha ao iniciar', err);
  showFallback();
});
