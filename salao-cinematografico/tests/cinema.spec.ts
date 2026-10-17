import { expect, test, type Page } from '@playwright/test';

type CinemaState = Record<string, number>;
declare global {
  interface Window {
    __cinema?: {
      state: CinemaState;
      timeline: { progress(): number };
      info(): { calls: number; triangles: number };
      setFloat(on: boolean): void;
    };
  }
}

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push(`falhou: ${r.url()}`));
  return errors;
}

/**
 * Abre a página e espera a cena. A flutuação contínua é desligada por padrão:
 * no SwiftShader (WebGL por CPU) cada quadro custa caro e atrasaria o scrub.
 */
async function ready(page: Page, url = '/', { float = false } = {}) {
  await page.goto(url);
  await page.waitForFunction(() => !!window.__cinema, null, { timeout: 45_000 });
  if (!float) await page.evaluate(() => window.__cinema!.setFloat(false));
}

/** rola até uma fração da seção .cinema e espera o scrub assentar */
async function scrollCinema(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const el = document.querySelector<HTMLElement>('.cinema')!;
    const max = el.offsetHeight - window.innerHeight;
    window.scrollTo(0, el.offsetTop + max * f);
  }, fraction);
  await expect.poll(async () => page.evaluate((f) => Math.abs(window.__cinema!.timeline.progress() - f), fraction), { timeout: 15_000 }).toBeLessThan(0.01);
}

const state = (page: Page) => page.evaluate(() => ({ ...window.__cinema!.state }));

test('carrega sem erros e desenha a cena inicial', async ({ page }) => {
  const errors = watchErrors(page);
  await ready(page, '/', { float: true });
  await expect(page.locator('html')).toHaveClass(/webgl-ready/);
  await expect(page.locator('h1')).toContainText('Beleza em');
  const s = await state(page);
  expect(s.bloom).toBe(0);
  expect(s.polishScale).toBeLessThan(0.5);
  // o canvas não pode estar vazio: o desenho precisa ter variação de cor
  const shot = await page.locator('.cinema__canvas').screenshot();
  expect(new Set(shot.subarray(200, 20000)).size).toBeGreaterThan(40);
  const info = await page.evaluate(() => window.__cinema!.info());
  expect(info.triangles).toBeGreaterThan(10_000);
  expect(errors).toEqual([]);
});

test('a rolagem conduz a sequência: flor → esmalte → giro → tampa → pincel', async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  await ready(page);
  const shots: [string, number][] = [
    ['flor-abrindo', 0.1],
    ['esmalte-surgindo', 0.22],
    ['frasco-girando', 0.42],
    ['tampa-desenroscando', 0.66],
    ['pincel-saindo', 0.79],
    ['pincel-revelado', 0.97],
  ];
  const seen: CinemaState[] = [];
  for (const [name, f] of shots) {
    await scrollCinema(page, f);
    seen.push(await state(page));
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
  }
  const [flor, sobe, gira, tampa, pincel, fim] = seen;
  expect(flor.bloom).toBeGreaterThan(0.2);
  expect(sobe.polishY).toBeGreaterThan(flor.polishY);
  expect(sobe.polishScale).toBeGreaterThan(flor.polishScale);
  expect(gira.polishRotY).toBeGreaterThan(sobe.polishRotY);
  expect(tampa.capTurns).toBeGreaterThan(0.5);
  expect(tampa.capLift).toBe(0);
  expect(pincel.capLift).toBeGreaterThan(0.3);
  expect(fim.capTiltZ).toBeLessThan(-0.3);
  expect(fim.dropSize).toBeGreaterThan(0.5);
  await expect(page.locator('[data-chapter="4"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('rolagem reversa desfaz a animação de forma consistente', async ({ page }) => {
  await ready(page);
  const initial = await state(page);
  await scrollCinema(page, 1);
  // volta rápida, sem paradas
  await scrollCinema(page, 0.3);
  const mid = await state(page);
  expect(mid.capTurns).toBe(0);
  expect(mid.capLift).toBe(0);
  await scrollCinema(page, 0);
  const back = await state(page);
  for (const k of ['bloom', 'polishY', 'polishScale', 'capTurns', 'capLift', 'camZ', 'dropSize']) {
    expect(back[k], k).toBeCloseTo(initial[k], 3);
  }
  await expect(page.locator('[data-chapter="0"]')).toBeVisible();
  await expect(page.locator('[data-chapter="3"]')).toBeHidden();
});

test('rolagem com a roda do mouse, lenta e rápida, não gera erros', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'roda do mouse só no desktop');
  const errors = watchErrors(page);
  await ready(page);
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 120);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 1500);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -1500);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('atalho de teclado pula a apresentação', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'teclado só no desktop');
  await ready(page);
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#servicos-titulo')).toBeInViewport();
});

test('agendamento: sem número completo, WhatsApp fica desativado e explica o motivo', async ({ page }) => {
  await ready(page);
  const cta = page.locator('[data-booking-link]');
  await expect(cta).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-booking-text]')).toContainText('número completo do salão for confirmado');
  // nenhum link de conversa montado com número incompleto
  await expect(page.locator('a[href*="wa.me"], a[href^="tel:"]')).toHaveCount(0);
  await page.locator('.chapter--hero .btn', { hasText: 'Agendar horário' }).click();
  await expect(page.locator('#agendamento')).toBeInViewport();
});

test('identidade e contatos: só dados informados pelo salão, pendências sinalizadas', async ({ page }) => {
  await ready(page);
  await expect(page.locator('.wordmark')).toHaveText('Salão Iolanda');
  await expect(page).toHaveTitle(/Salão Iolanda/);
  const booking = page.locator('#agendamento');
  await expect(booking).toContainText('Rua Castro Alves, 2995 — Cascavel/PR');
  await expect(booking).toContainText('3224-7223');
  await expect(booking).toContainText('DDD a confirmar');
  await expect(booking).toContainText('Horário de atendimento a confirmar');
  await expect(page.locator('[data-salon-link="instagram"]')).toHaveAttribute('href', 'https://www.instagram.com/salaoiolanda/');
  await expect(page.locator('[data-salon-link="maps"]')).toHaveAttribute('href', /google\.com\/maps\/search\/.*Castro%20Alves/);
  // sem preços, promoções ou horários inventados
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/R\$|promo|desconto|\d{1,2}h\s*(às|-)/i);
});

test('movimento reduzido: apresentação estática, conteúdo acessível', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = watchErrors(page);
  await ready(page);
  await expect(page.locator('html')).toHaveClass(/is-static/);
  const h = await page.locator('.cinema').evaluate((el) => el.getBoundingClientRect().height);
  const vh = page.viewportSize()!.height;
  expect(h).toBeLessThan(vh * 1.5);
  await expect(page.locator('h1')).toBeVisible();
  await page.locator('#conteudo').scrollIntoViewIfNeeded();
  await expect(page.locator('.categories li')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('sem WebGL: imagem estática no lugar do canvas, botões funcionando', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?sem-webgl');
  await expect(page.locator('html')).toHaveClass(/no-webgl/);
  await expect(page.locator('.cinema__canvas')).toHaveCount(0);
  const img = page.locator('.cinema__fallback img');
  await expect(img).toBeVisible();
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.locator('.chapter--hero .btn', { hasText: 'Ver serviços' }).click();
  await expect(page.locator('#servicos-titulo')).toBeInViewport();
  expect(errors).toEqual([]);
});
