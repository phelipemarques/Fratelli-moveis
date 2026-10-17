import { expect, test } from '@playwright/test';

const sizes: [number, number][] = [
  [320, 568], [360, 800], [375, 667], [390, 844], [393, 852], [414, 896], [430, 932], [768, 1024],
  [844, 390], [667, 375], // celular deitado
  [1024, 768], [1440, 900], [1920, 1080],
];

test.describe('larguras de tela', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'roda uma vez, no projeto desktop');
  });

  for (const [w, h] of sizes) {
    test(`${w}×${h}: sem rolagem horizontal, títulos e botões inteiros`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/?dpr=0.5');
      await page.waitForFunction(() => !!window.__cinema, null, { timeout: 60_000 });
      await page.evaluate(() => window.__cinema!.setFloat(false));
      await expect(page.locator('h1')).toBeInViewport();
      const h1 = (await page.locator('h1').boundingBox())!;
      expect(h1.x).toBeGreaterThanOrEqual(0);
      expect(h1.x + h1.width).toBeLessThanOrEqual(w);
      await page.screenshot({ path: testInfo.outputPath(`inicio-${w}x${h}.png`) });

      for (const id of ['salao', 'servicos', 'cabelos', 'portfolio', 'agendamento', 'contato']) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `rolagem horizontal em #${id}`).toBeLessThanOrEqual(0);
        // nenhum botão ou título da seção passa da borda da tela
        const out = await page.locator(`#${id} .btn, #${id} .title, #${id} .chip`).evaluateAll((els, vw) =>
          els.filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && (r.left < -1 || r.right > vw + 1);
          }).map((e) => e.textContent?.trim().slice(0, 30)), w);
        expect(out, `elementos cortados em #${id}`).toEqual([]);
      }
      await page.locator('#servicos').scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`servicos-${w}x${h}.png`) });
    });
  }
});
