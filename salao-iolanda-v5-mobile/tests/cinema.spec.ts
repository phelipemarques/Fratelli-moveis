import { expect, test } from '@playwright/test';
import { ready, scrollToTime, state, watchErrors } from './helpers';

test('carrega sem erros e desenha a cena inicial', async ({ page }) => {
  const errors = watchErrors(page);
  await ready(page, '/?dpr=0.5', { float: true });
  await expect(page.locator('html')).toHaveClass(/webgl-ready/);
  await expect(page.locator('h1')).toContainText('Seu momento');
  const s = await state(page);
  expect(s.bloom).toBe(0);
  expect(s.brushScale).toBe(0);
  const shot = await page.locator('.cinema__canvas').screenshot();
  expect(new Set(shot.subarray(200, 20000)).size).toBeGreaterThan(40);
  const info = await page.evaluate(() => window.__cinema!.info());
  expect(info.triangles).toBeGreaterThan(10_000);
  expect(errors).toEqual([]);
});

test('a rolagem conduz a sequência até a marca: flor → esmalte → giro → tampa → pincel → Salão Iolanda', async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  await ready(page);
  const marks = await page.evaluate(() => window.__cinema!.marks);
  const shots: [string, number][] = [
    ['flor-abrindo', 1.2],
    ['esmalte-surgindo', 3.0],
    ['frasco-girando', 4.8],
    ['tampa-desenroscando', 7.6],
    ['pincel-saindo', 9.0],
    ['pincel-revelado', 11.4],
    ['marca', 14.6],
    ['fim', marks.end],
  ];
  const seen: Record<string, number>[] = [];
  for (const [name, t] of shots) {
    await scrollToTime(page, t);
    seen.push(await state(page));
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
  }
  const [flor, sobe, gira, tampa, pincel, revelado, marca, fim] = seen;
  expect(flor.bloom).toBeGreaterThan(0.2);
  expect(sobe.polishY).toBeGreaterThan(flor.polishY);
  expect(sobe.polishScale).toBeGreaterThan(flor.polishScale);
  expect(gira.polishRotY).toBeGreaterThan(sobe.polishRotY);
  expect(tampa.capTurns).toBeGreaterThan(0.5);
  expect(tampa.capLift).toBe(0);
  expect(pincel.capLift).toBeGreaterThan(0.3);
  expect(revelado.capTiltZ).toBeLessThan(-0.3);
  expect(revelado.dropSize).toBeGreaterThan(0.4);
  // o produto sai e o nome do salão assume
  expect(marca.polishX).toBeGreaterThan(3);
  expect(marca.brushScale).toBeGreaterThan(0.9);
  expect(fim.brushTiltZ).toBeLessThan(-0.5);
  await expect(page.locator('[data-chapter="5"] .brand-title')).toBeVisible();
  await expect(page.locator('[data-chapter="4"]')).toBeHidden();
  expect(errors).toEqual([]);
});

test('rolagem reversa desfaz a animação de forma consistente', async ({ page }) => {
  await ready(page);
  const initial = await state(page);
  const end = await page.evaluate(() => window.__cinema!.marks.end);
  await scrollToTime(page, end);
  await scrollToTime(page, 4.0);
  const mid = await state(page);
  expect(mid.capTurns).toBe(0);
  expect(mid.polishX).toBe(0);
  expect(mid.brushScale).toBe(0);
  // o scrub assenta exatamente no início: comparar só depois de chegar lá
  await scrollToTime(page, 0, 0.0005);
  const back = await state(page);
  for (const k of ['bloom', 'polishY', 'polishScale', 'capTurns', 'capLift', 'camZ', 'dropSize', 'brushScale', 'mood']) {
    expect(back[k], k).toBeCloseTo(initial[k], 3);
  }
  await expect(page.locator('[data-chapter="0"]')).toBeVisible();
  await expect(page.locator('[data-chapter="5"]')).toBeHidden();
});

test('roda do mouse lenta e rápida, nos dois sentidos, sem erros', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'roda do mouse só no desktop');
  const errors = watchErrors(page);
  await ready(page);
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 120);
  for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 1600);
  for (let i = 0; i < 8; i++) await page.mouse.wheel(0, -1600);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('redimensionar no meio da sequência mantém o estado e não gera erros', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'um projeto basta');
  const errors = watchErrors(page);
  await ready(page);
  // compara só com o scrub assentado: a tolerância padrão (1% da timeline) vale ~0,27 volta da tampa
  await scrollToTime(page, 7.6, 0.0005);
  const before = await state(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(800);
  await scrollToTime(page, 7.6, 0.0005);
  const after = await state(page);
  expect(after.capTurns).toBeCloseTo(before.capTurns, 1);
  expect(errors).toEqual([]);
});

test('"Pular apresentação" leva aos serviços pelo teclado', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'teclado só no desktop');
  await ready(page);
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#servicos-titulo')).toBeInViewport();
  // a cena terminou no estado final (rolagem passou por toda a seção)
  await expect.poll(() => page.evaluate(() => window.__cinema!.timeline.progress()), { timeout: 30_000 }).toBeGreaterThan(0.99);
});

test('movimento reduzido: apresentação estática, conteúdo acessível', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = watchErrors(page);
  await ready(page);
  await expect(page.locator('html')).toHaveClass(/is-static/);
  const h = await page.locator('.cinema').evaluate((el) => el.getBoundingClientRect().height);
  expect(h).toBeLessThan(page.viewportSize()!.height * 1.5);
  await expect(page.locator('h1')).toBeVisible();
  await page.locator('#servicos').scrollIntoViewIfNeeded();
  await expect(page.locator('.svc')).toHaveCount(5);
  await expect(page.locator('.svc').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('sem WebGL: composição estática, marca, botões e navegação funcionando', async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  await page.goto('/?sem-webgl');
  await expect(page.locator('html')).toHaveClass(/no-webgl/);
  await expect(page.locator('.cinema__canvas')).toHaveCount(0);
  const img = page.locator('.cinema__fallback img');
  await expect(img).toBeVisible();
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.brandline')).toContainText('Salão Iolanda');
  await expect(page.locator('.chapter--hero a[href*="wa.me"]')).toBeVisible();
  if (testInfo.project.name === 'mobile') {
    // no celular o caminho para os serviços é o menu (o hero mostra só o agendamento)
    await page.locator('[data-menu-open]').click();
    await page.locator('#menu-mobile a', { hasText: 'Serviços' }).click();
  } else {
    await page.locator('.chapter--hero .btn', { hasText: 'Conhecer os serviços' }).click();
  }
  await expect(page.locator('#servicos-titulo')).toBeInViewport();
  expect(errors).toEqual([]);
});

test('celular: cada fase mostra o objeto principal inteiro (até 5% fora da tela)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'câmera própria do celular');
  await ready(page);
  const phases: [string, number, string][] = [
    ['botão', 0, 'flor'], ['flor abrindo', 0.9, 'flor'], ['flor aberta', 2.0, 'flor'], ['esmalte surgindo', 3.0, 'frasco'],
    ['frasco girando', 4.8, 'frasco'], ['tampa', 7.6, 'tampa'], ['pincel saindo', 8.8, 'tampa'], ['pincel revelado', 11.0, 'tampa'],
    ['escova', 13.4, 'escova'], ['marca', 15.5, 'escova'],
  ];
  for (const [name, t, obj] of phases) {
    const b = await page.evaluate(([t, obj]) => {
      window.__cinema!.timeline.seek(t as number);
      const all = window.__cinema!.bounds();
      return { r: all[obj as string], w: all.w, h: all.h };
    }, [t, obj] as const);
    expect(b.r, name).not.toBeNull();
    const r = b.r!;
    const area = (r.x1 - r.x0) * (r.y1 - r.y0);
    const inside = Math.max(0, Math.min(r.x1, b.w) - Math.max(r.x0, 0)) * Math.max(0, Math.min(r.y1, b.h) - Math.max(r.y0, 0));
    expect(1 - inside / area, `${name}: parte fora da tela`).toBeLessThanOrEqual(0.05);
  }
});

test('celular: "Pular apresentação" visível como botão e funciona no meio da sequência', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'pílula do celular');
  const errors = watchErrors(page);
  await ready(page);
  await scrollToTime(page, 6.5);
  const skip = page.locator('[data-skip]');
  await expect(skip).toBeVisible();
  const box = (await skip.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  await skip.tap();
  await expect(page.locator('#servicos-titulo')).toBeInViewport();
  await expect.poll(() => page.evaluate(() => window.__cinema!.timeline.progress()), { timeout: 30_000 }).toBeGreaterThan(0.99);
  expect(errors).toEqual([]);
});
