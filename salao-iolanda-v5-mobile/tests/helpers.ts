import { expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __cinema?: {
      state: Record<string, number>;
      timeline: { progress(): number; duration(): number; seek(t: number): void };
      marks: Record<string, number>;
      info(): { calls: number; triangles: number; pixelRatio: number };
      bounds(): Record<string, { x0: number; y0: number; x1: number; y1: number } | null> & { w: number; h: number };
      setFloat(on: boolean): void;
      render(): void;
    };
  }
}

export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => {
    // links externos não são carregados pela página; só recursos próprios contam
    if (r.url().startsWith('http://localhost')) errors.push(`falhou: ${r.url()}`);
  });
  return errors;
}

/**
 * Abre a página e espera a cena. No SwiftShader (WebGL por CPU, sem GPU) um
 * quadro em 1440×900 custa ~2 s; os testes de rolagem usam ?dpr=0.3 para que o
 * scrub acompanhe. Isso reduz só a resolução do canvas, não a lógica testada.
 */
export async function ready(page: Page, url = '/?dpr=0.3', { float = false } = {}) {
  await page.goto(url);
  await page.waitForFunction(() => !!window.__cinema, null, { timeout: 60_000 });
  if (!float) await page.evaluate(() => window.__cinema!.setFloat(false));
}

/** rola até o instante t da timeline e espera o scrub assentar */
export async function scrollToTime(page: Page, t: number, tolerance = 0.01) {
  const target = await page.evaluate((t) => {
    const c = window.__cinema!;
    const el = document.querySelector<HTMLElement>('.cinema')!;
    const f = t / c.timeline.duration();
    window.scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * f);
    return f;
  }, t);
  await expect
    .poll(async () => page.evaluate((f) => Math.abs(window.__cinema!.timeline.progress() - f), target), { timeout: 30_000 })
    .toBeLessThan(tolerance);
}

export const state = (page: Page) => page.evaluate(() => ({ ...window.__cinema!.state }));
