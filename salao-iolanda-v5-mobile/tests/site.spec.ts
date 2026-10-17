import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

const WA = /^https:\/\/wa\.me\/554532247223\?text=/;
const MESSAGES = [
  'Olá! Vim pelo site do Salão Iolanda e gostaria de agendar um horário.',
  'Olá! Gostaria de informações sobre agendamento de cabelo.',
  'Olá! Gostaria de agendar um serviço de unhas.',
  'Olá! Gostaria de informações sobre maquiagem.',
  'Olá! Gostaria de informações sobre agendamento de depilação.',
  'Olá! Gostaria de informações sobre os serviços de estética.',
];

// estes testes não dependem do 3D: a cena fica fora para que rodem rápido
const open = (page: import('@playwright/test').Page) => page.goto('/?sem-webgl');

test('WhatsApp: todos os links usam o número informado e mensagens válidas', async ({ page }) => {
  await open(page);
  const links = await page.locator('a[href*="wa.me"]').evaluateAll((as) =>
    as.map((a) => ({ href: a.getAttribute('href')!, target: a.getAttribute('target'), rel: a.getAttribute('rel') })),
  );
  expect(links.length).toBeGreaterThan(10);
  for (const l of links) {
    expect(l.href).toMatch(WA);
    expect(MESSAGES).toContain(decodeURIComponent(new URL(l.href).searchParams.get('text')!));
    expect(l.target).toBe('_blank');
    expect(l.rel).toContain('noopener');
  }
  // as mensagens de contexto existem: cabelo, unhas, maquiagem
  for (const key of ['cabelo', 'unhas', 'maquiagem']) await expect(page.locator(`a[data-wa="${key}"]`).first()).toBeAttached();
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/WhatsApp em breve|DDD a confirmar|Contato pendente/i);
});

test('endereço, Google Maps, telefone e Instagram corretos', async ({ page }) => {
  await open(page);
  const maps = await page.locator('a[data-maps]').first().getAttribute('href');
  expect(maps).toBe('https://www.google.com/maps/search/?api=1&query=Sal%C3%A3o%20Iolanda%2C%20Rua%20Castro%20Alves%2C%202995%2C%20Cascavel%20-%20PR');
  await expect(page.locator('#contato')).toContainText('Rua Castro Alves, 2995');
  await expect(page.locator('#contato')).toContainText('Cascavel — Paraná');
  await expect(page.locator('#contato a[href="tel:+554532247223"]')).toHaveText('(45) 3224-7223');
  await expect(page.locator('a[href="https://www.instagram.com/salaoiolanda/"]').first()).toBeAttached();
});

test('nada inventado: sem preços, avaliações, horários ou promoções', async ({ page }) => {
  await open(page);
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/R\$|promo|desconto|avalia|estrelas|★|\d{1,2}h\s*(às|-)|segunda a/i);
  await expect(page.locator('#contato')).toContainText('Consulte o salão pelo WhatsApp');
  // espaços de foto sem arquivo estão identificados como pendentes
  const ph = page.locator('.ph');
  expect(await ph.count()).toBeGreaterThan(5);
  for (const label of await ph.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''))) {
    expect(label).toContain('Foto autorizada pendente');
  }
});

test('SEO da prévia: título, descrição, JSON-LD do salão e noindex', async ({ page }) => {
  await open(page);
  await expect(page).toHaveTitle('Salão Iolanda | Salão de Beleza e Estética em Cascavel/PR');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Cascavel/);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld['@type']).toBe('BeautySalon');
  expect(ld.name).toBe('Salão Iolanda');
  expect(ld.address.streetAddress).toBe('Rua Castro Alves, 2995');
  expect(ld.telephone).toBe('+554532247223');
  expect(ld.aggregateRating).toBeUndefined();
  expect(ld.openingHours).toBeUndefined();
  expect(await page.locator('h1').count()).toBe(1);
  const robots = await page.request.get('/robots.txt');
  expect(await robots.text()).toContain('Disallow: /');
});

test('portfólio: filtro, lightbox com teclado, contador e foco restaurado', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page);
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  await page.locator('.pf__filters .chip', { hasText: 'Penteados' }).click();
  const visible = page.locator('.pf__cell:not([hidden])');
  await expect(visible).toHaveCount(2);
  await page.locator('.pf__filters .chip', { hasText: 'Todos' }).click();
  await expect(visible).toHaveCount(8);

  const first = page.locator('.pf__item').first();
  await first.click();
  const lb = page.locator('[data-lightbox]');
  await expect(lb).toBeVisible();
  await expect(lb.locator('[data-lb-count]')).toHaveText('1 / 8');
  await expect(lb.locator('[data-lb-caption]')).toContainText('foto autorizada pendente');
  await page.keyboard.press('ArrowRight');
  await expect(lb.locator('[data-lb-count]')).toHaveText('2 / 8');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(lb.locator('[data-lb-count]')).toHaveText('8 / 8');
  await page.keyboard.press('Escape');
  await expect(lb).toBeHidden();
  await expect(first).toBeFocused();
  expect(errors).toEqual([]);
});

test('lightbox: arraste lateral troca a foto no toque', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'toque só no mobile');
  await open(page);
  await page.locator('.pf__item').nth(2).click();
  const count = page.locator('[data-lb-count]');
  await expect(count).toHaveText('3 / 8');
  const box = (await page.locator('.lightbox__figure').boundingBox())!;
  const y = box.y + box.height / 2;
  await page.locator('.lightbox__figure').dispatchEvent('pointerdown', { pointerType: 'touch', clientX: box.x + box.width * 0.8, clientY: y });
  await page.locator('.lightbox__figure').dispatchEvent('pointerup', { pointerType: 'touch', clientX: box.x + box.width * 0.2, clientY: y });
  await expect(count).toHaveText('4 / 8');
  await page.locator('[data-lb-close]').click();
  await expect(page.locator('[data-lightbox]')).toBeHidden();
});

test('menu mobile: abre, navega, fecha com Esc e devolve o foco', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'menu só no mobile');
  await open(page);
  const btn = page.locator('[data-menu-open]');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  const panel = page.locator('#menu-mobile');
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(btn).toBeFocused();
  await btn.click();
  await panel.locator('a', { hasText: 'Portfólio' }).click();
  await expect(panel).toBeHidden();
  await expect(page.locator('#portfolio-titulo')).toBeInViewport();
});

test('barra de agendamento: escondida na primeira tela, aparece no caminho, some onde a página repete os botões', async ({ page }, testInfo) => {
  await open(page);
  const bar = page.locator('.mbar');
  if (testInfo.project.name !== 'mobile') {
    await expect(bar).toBeHidden();
    return;
  }
  // primeira tela: o hero já tem o botão de agendamento
  await expect(bar).toBeHidden();
  await page.locator('#servicos').scrollIntoViewIfNeeded();
  await expect(bar).toBeVisible();
  await expect(bar.locator('a[href*="wa.me"]')).toBeVisible();
  await expect(bar.locator('a[data-maps]')).toBeVisible();
  // no contato e no rodapé os mesmos botões já estão na página
  await page.locator('#contato .contact__actions').scrollIntoViewIfNeeded();
  await expect(bar).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(bar).toBeHidden();
  const legal = (await page.locator('.site-footer__legal').boundingBox())!;
  expect(legal.y + legal.height).toBeLessThanOrEqual(page.viewportSize()!.height);
});

test('lightbox: ao fechar, a página volta exatamente para onde estava', async ({ page }) => {
  await open(page);
  await page.locator('.pf__item').nth(3).scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await page.locator('.pf__item').nth(3).click();
  await expect(page.locator('[data-lightbox]')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-lightbox]')).toBeHidden();
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThanOrEqual(1);
});

test('menu mobile trava a rolagem do fundo enquanto aberto', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'menu só no mobile');
  await open(page);
  await page.locator('[data-menu-open]').click();
  await expect(page.locator('html')).toHaveClass(/menu-open/);
  const y = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => scrollY)).toBe(y);
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveClass(/menu-open/);
});

test('cabeçalho do celular recolhe ao descer e volta ao subir, sem mudar o layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'comportamento só do celular');
  await open(page);
  await page.locator('#servicos').scrollIntoViewIfNeeded();
  const header = page.locator('[data-header]');
  const top = await page.locator('#servicos-titulo').evaluate((e) => e.getBoundingClientRect().top + scrollY);
  await page.mouse.wheel(0, 600);
  await expect(header).toHaveClass(/is-tucked/);
  await page.mouse.wheel(0, -300);
  await expect(header).not.toHaveClass(/is-tucked/);
  // posição dos elementos na página não muda (só transform)
  expect(await page.locator('#servicos-titulo').evaluate((e) => e.getBoundingClientRect().top + scrollY)).toBeCloseTo(top, 0);
});

test('sem JavaScript: marca, título, serviços e WhatsApp continuam na página', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.cinema__fallback img')).toBeVisible();
  await expect(page.locator('.chapter--hero a[href*="wa.me"]')).toBeVisible();
  await page.locator('#servicos').scrollIntoViewIfNeeded();
  await expect(page.locator('.svc').first()).toBeVisible();
  await expect(page.locator('[data-chapter="3"]')).toBeHidden();
  await ctx.close();
});
