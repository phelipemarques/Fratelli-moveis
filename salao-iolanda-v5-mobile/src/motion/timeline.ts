import gsap from 'gsap';
import { BRUSH_CLEARANCE } from '../three/polish';
import type { SceneState } from '../three/stage';

/**
 * Timeline mestre da primeira sequência. Unidades arbitrárias (≈ 12 no total);
 * o ScrollTrigger converte a rolagem em progresso 0–1 dessa timeline.
 *
 *  0.0–2.4  flor abre (camadas de fora para dentro), câmera aproxima
 *  1.5–3.8  esmalte sobe do centro, câmera acompanha, flor desce
 *  3.6–6.2  frasco gira e inclina, revelando as faces
 *  6.0–6.8  câmera fecha na tampa
 *  6.8–8.0  tampa desenrosca (2 voltas, subindo pelo passo da rosca)
 *  8.0–9.0  tampa sobe até a ponta do pincel sair do gargalo
 *  9.0–10.2 tampa e pincel inclinam juntos
 * 10.2–11.5 close no pincel; a gota se forma
 * 11.8–13.4 o esmalte sai da composição; a câmera recua; o fundo vira preto e bordô
 * 12.5–     o nome SALÃO IOLANDA assume a tela
 * 12.9–15.2 a escova redonda entra girando: ponte para os serviços de cabelo
 * 15.2–16.2 respiro final, antes do conteúdo do site
 */
export const MARKS = {
  bloom: 0,
  rise: 1.5,
  spin: 3.6,
  approach: 6.0,
  unscrew: 6.8,
  lift: 8.0,
  reveal: 9.0,
  close: 10.2,
  exit: 11.8,
  brand: 12.5,
  brush: 12.9,
  end: 16.2,
} as const;

/** quadro único usado no modo de movimento reduzido e nas imagens de fallback */
export const STILL_TIME = 3.35;

export function buildTimeline(state: SceneState, onUpdate: () => void) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate });
  const S = state;

  // ---------- flor abrindo: a câmera sobe e olha para dentro da flor ----------
  tl.to(S, { bloom: 1, duration: 2.6, ease: 'sine.inOut' }, MARKS.bloom)
    .to(S, { camZ: 5.2, camY: 2.9, tgtY: 0.45, duration: 2.0, ease: 'sine.inOut' }, MARKS.bloom)
    .to(S, { flowerSpin: 0.35, duration: 3.6, ease: 'sine.inOut' }, MARKS.bloom)
    .to(S, { mood: 1, keyWarmth: 1, duration: 2.2, ease: 'sine.inOut' }, MARKS.bloom);

  // ---------- esmalte subindo de dentro da flor ----------
  tl.to(S, { polishY: 2.3, duration: 2.3, ease: 'power2.inOut' }, MARKS.rise)
    .to(S, { polishScale: 1, duration: 2.0, ease: 'power1.inOut' }, MARKS.rise + 0.1)
    .to(S, { polishRotY: Math.PI * 0.6, duration: 2.3, ease: 'sine.inOut' }, MARKS.rise)
    .to(S, { flowerY: -0.35, flowerScale: 1.25, duration: 2.4, ease: 'power1.inOut' }, MARKS.rise + 0.2)
    .to(S, { tgtY: 2.15, camY: 2.75, camZ: 5.3, duration: 2.3, ease: 'power2.inOut' }, MARKS.rise + 0.1);

  // ---------- frasco girando: termina de frente, com o rótulo para a câmera ----------
  tl.to(S, { polishRotY: Math.PI * 2, duration: 2.6, ease: 'sine.inOut' }, MARKS.spin)
    .to(S, { polishRotZ: 0.24, polishRotX: 0.32, duration: 1.1, ease: 'sine.inOut' }, MARKS.spin)
    .to(S, { polishRotZ: -0.14, polishRotX: -0.12, duration: 1.0, ease: 'sine.inOut' }, MARKS.spin + 1.1)
    .to(S, { polishRotZ: 0, polishRotX: 0, duration: 0.6, ease: 'sine.inOut' }, MARKS.spin + 2.1)
    .to(S, { camZ: 4.7, camX: 0.4, camY: 2.5, duration: 1.3, ease: 'sine.inOut' }, MARKS.spin)
    .to(S, { camX: -0.3, duration: 1.3, ease: 'sine.inOut' }, MARKS.spin + 1.3)
    .to(S, { mood: 2, duration: 2.4 }, MARKS.spin)
    .to(S, { flowerY: -0.75, duration: 2.4, ease: 'sine.inOut' }, MARKS.spin);

  // ---------- aproximação da tampa ----------
  tl.to(S, { camX: 0, camZ: 3.6, camY: 2.95, tgtY: 2.55, shiftX: 0.14, duration: 0.9, ease: 'power2.inOut' }, MARKS.approach)
    .to(S, { flowerY: -1.3, duration: 1.2, ease: 'power1.in' }, MARKS.approach);

  // ---------- desenroscar ----------
  tl.to(S, { capTurns: 2, duration: 1.2, ease: 'power1.inOut' }, MARKS.unscrew)
    .to(S, { camZ: 3.3, duration: 1.2, ease: 'sine.inOut' }, MARKS.unscrew);

  // ---------- erguer até o pincel sair ----------
  tl.to(S, { capLift: BRUSH_CLEARANCE, duration: 1.0, ease: 'power2.inOut' }, MARKS.lift)
    .to(S, { tgtY: 3.0, camY: 3.3, camZ: 4.0, duration: 1.0, ease: 'power2.inOut' }, MARKS.lift);

  // ---------- inclinar e revelar o pincel ----------
  tl.to(S, { capTiltZ: -0.55, capTiltX: -0.28, capShiftX: 0.5, capLift: BRUSH_CLEARANCE + 0.12, duration: 1.2, ease: 'power2.inOut' }, MARKS.reveal)
    .to(S, { tgtX: 0.15, tgtY: 3.15, camX: -0.3, camY: 3.35, camZ: 3.4, duration: 1.2, ease: 'power2.inOut' }, MARKS.reveal)
    .to(S, { mood: 3, keyWarmth: 0.4, duration: 1.4 }, MARKS.reveal)
    // close no pincel: a gota se forma na ponta
    .to(S, { tgtX: 0.22, tgtY: 3.22, camX: -0.45, camY: 3.32, camZ: 3.05, shiftX: 0.1, duration: 1.3, ease: 'sine.inOut' }, MARKS.close)
    .to(S, { dropSize: 0.85, duration: 1.3, ease: 'power1.in' }, MARKS.close + 0.1);

  // ---------- saída do produto: o salão assume ----------
  tl.to(S, { polishX: 3.4, polishY: 3.9, polishRotZ: -0.55, polishRotY: Math.PI * 2.35, duration: 1.6, ease: 'power2.in' }, MARKS.exit)
    .to(S, { dropSize: 0, duration: 0.4, ease: 'power1.in' }, MARKS.exit)
    .to(S, { tgtX: 0, tgtY: 4.4, camX: 0, camY: 4.55, camZ: 6.2, shiftX: 0.2, duration: 1.9, ease: 'power2.inOut' }, MARKS.exit + 0.1)
    .to(S, { mood: 4, keyWarmth: 0.75, duration: 1.6, ease: 'sine.inOut' }, MARKS.exit + 0.2);

  // ---------- escova redonda: gira e assenta na diagonal ----------
  tl.to(S, { brushScale: 1, duration: 0.9, ease: 'power2.out' }, MARKS.brush)
    .to(S, { brushY: 4.35, duration: 2.0, ease: 'power3.out' }, MARKS.brush)
    .to(S, { brushSpin: Math.PI * 2.5, duration: 2.3, ease: 'sine.out' }, MARKS.brush)
    .to(S, { brushTiltZ: -0.62, brushTiltX: 0.12, duration: 2.1, ease: 'power2.inOut' }, MARKS.brush + 0.1);

  // ---------- câmera do celular (só vale em retrato, ver Stage.apply) ----------
  // a flor aberta é mais larga que a tela: a câmera recua para mostrá-la inteira,
  // volta a fechar no frasco e recua um pouco quando tampa e pincel se afastam
  tl.to(S, { mDist: 1.5, mLift: 0, duration: 1.5, ease: 'sine.inOut' }, 0.45)
    .to(S, { mDist: 1, duration: 1.1, ease: 'sine.inOut' }, 2.3)
    .to(S, { mDist: 1.24, duration: 1.1, ease: 'sine.inOut' }, MARKS.reveal)
    .to(S, { mDist: 1, duration: 0.9, ease: 'sine.inOut' }, MARKS.exit);

  tl.set({}, {}, MARKS.end);
  return tl;
}

/** Capítulos de texto: [seletor, entrada, saída]. A saída `null` mantém visível até o fim. */
export const CHAPTERS: [string, number | null, number | null][] = [
  ['[data-chapter="0"]', null, 0.55],
  ['[data-chapter="1"]', 1.15, 2.85],
  ['[data-chapter="2"]', 3.2, 5.0],
  ['[data-chapter="3"]', 5.55, 7.4],
  ['[data-chapter="4"]', 8.6, 11.6],
  ['[data-chapter="5"]', MARKS.brand, null],
];

export function addChapters(tl: gsap.core.Timeline) {
  for (const [sel, tIn, tOut] of CHAPTERS) {
    const el = document.querySelector<HTMLElement>(sel);
    if (!el) continue;
    const lines = el.querySelectorAll<HTMLElement>('.line > span');
    const rest = el.querySelectorAll<HTMLElement>('[data-fade]');
    if (tIn !== null) {
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, immediateRender: false }, tIn);
      // o nome do salão entra mais devagar: é o momento da marca
      const brand = el.classList.contains('chapter--brand');
      tl.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: brand ? 1.0 : 0.55, stagger: brand ? 0.18 : 0.08, ease: brand ? 'power4.out' : 'power3.out', immediateRender: tIn > 0 }, tIn);
      tl.fromTo(rest, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out', immediateRender: tIn > 0 }, tIn + 0.25);
    }
    if (tOut !== null) {
      tl.to(lines, { yPercent: -110, duration: 0.45, stagger: 0.05, ease: 'power2.in' }, tOut);
      tl.to(rest, { autoAlpha: 0, y: -10, duration: 0.35, ease: 'power2.in' }, tOut);
      tl.to(el, { autoAlpha: 0, duration: 0.05 }, tOut + 0.5);
    }
  }
}
