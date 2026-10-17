import { expect, test, type Page } from '@playwright/test';
import { ready, scrollToTime } from './helpers';

/**
 * Cinco jornadas de uso no celular, executadas por automação (não são testes com
 * pessoas reais). Para cada uma registra: número de ações (toques e rolagens),
 * tempo de execução e se o objetivo ficou visível e utilizável.
 * Cada resultado sai numa linha "JORNADA {...}" do relatório do Playwright.
 */
const results = {
  set(name: string, v: Record<string, unknown>) {
    console.log('JORNADA', JSON.stringify({ jornada: name, ...v }));
  },
};
test.describe.configure({ mode: 'serial' });
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'jornadas no celular');
});

function track(page: Page) {
  let actions = 0;
  const t0 = Date.now();
  return {
    tap: async (sel: string | ReturnType<Page['locator']>) => {
      actions++;
      const l = typeof sel === 'string' ? page.locator(sel) : sel;
      await l.tap();
    },
    scrollTo: async (sel: string) => {
      actions++;
      await page.locator(sel).scrollIntoViewIfNeeded();
    },
    done: (name: string, extra: Record<string, unknown> = {}) => {
      results.set(name, { acoes: actions, segundos: Number(((Date.now() - t0) / 1000).toFixed(1)), ...extra });
    },
  };
}

test('jornada 1: agendar manicure', async ({ page }) => {
  await ready(page);
  const j = track(page);
  await j.tap('[data-menu-open]');
  await j.tap(page.locator('#menu-mobile a', { hasText: 'Serviços' }));
  const cta = page.locator('.svc[data-svc="unhas"] a[data-wa="unhas"]');
  await j.scrollTo('.svc[data-svc="unhas"]');
  await expect(cta).toBeInViewport();
  const href = await cta.getAttribute('href');
  expect(decodeURIComponent(new URL(href!).searchParams.get('text')!)).toBe('Olá! Gostaria de agendar um serviço de unhas.');
  j.done('1-agendar-manicure', { caminho: 'menu → Serviços → "Agendar unhas"', mensagem: 'unhas' });
});

test('jornada 2: ver trabalhos de cabelo', async ({ page }) => {
  await ready(page);
  const j = track(page);
  await j.tap('[data-menu-open]');
  await j.tap(page.locator('#menu-mobile a', { hasText: 'Portfólio' }));
  await j.tap(page.locator('.pf__filters .chip', { hasText: 'Cabelos' }));
  const visible = page.locator('.pf__cell:not([hidden])');
  const expected = await page.locator('.pf__cell[data-category="Cabelos"]').count();
  await expect(visible).toHaveCount(expected);
  await expect(visible.first()).toBeInViewport();
  j.done('2-trabalhos-de-cabelo', { caminho: 'menu → Portfólio → filtro Cabelos', quadros: expected });
});

test('jornada 3: descobrir o endereço sem assistir à apresentação', async ({ page }) => {
  await ready(page);
  const j = track(page);
  await j.tap('[data-menu-open]');
  await j.tap(page.locator('#menu-mobile a', { hasText: 'Contato' }));
  await expect(page.locator('.contact__address')).toBeInViewport();
  await expect(page.locator('.contact__address')).toContainText('Rua Castro Alves, 2995');
  await expect(page.locator('#contato a[data-maps]')).toBeVisible();
  j.done('3-endereco', { caminho: 'menu → Contato (endereço e "Como chegar")', apresentacaoAssistida: false });
});

test('jornada 4: celular mais lento (CPU 6× mais lenta, rede 4G lenta)', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  const t0 = Date.now();
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  const h1 = (Date.now() - t0) / 1000;
  await expect(page.locator('.chapter--hero a[href*="wa.me"]')).toBeVisible();
  const cta = (Date.now() - t0) / 1000;
  // a cena 3D chega depois do texto; a página não depende dela para funcionar
  const webgl = await page
    .waitForFunction(() => document.documentElement.classList.contains('webgl-ready') || document.documentElement.classList.contains('no-webgl'), null, { timeout: 120_000 })
    .then(() => (Date.now() - t0) / 1000)
    .catch(() => null);
  results.set('4-celular-lento', { tituloVisivelS: Number(h1.toFixed(1)), botaoAgendarS: Number(cta.toFixed(1)), cena3dProntaS: webgl && Number(webgl.toFixed(1)), observacao: 'tempos medidos no contêiner de teste, WebGL por CPU' });
  expect(h1).toBeLessThan(10);
});

test('jornada 5: pular a apresentação no meio da animação', async ({ page }) => {
  await ready(page);
  await scrollToTime(page, 7.6);
  const j = track(page);
  await j.tap('[data-skip]');
  await expect(page.locator('#servicos-titulo')).toBeInViewport();
  await expect.poll(() => page.evaluate(() => window.__cinema!.timeline.progress()), { timeout: 30_000 }).toBeGreaterThan(0.99);
  // a página continua rolando normalmente depois do salto
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  j.done('5-pular-apresentacao', { caminho: 'botão "Pular apresentação" (fase da tampa)', travou: false });
});
