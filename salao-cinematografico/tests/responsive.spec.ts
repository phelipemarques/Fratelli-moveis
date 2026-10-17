import { expect, test } from '@playwright/test';

const widths: [number, number][] = [
  [320, 568], [360, 740], [375, 667], [375, 812], [390, 844], [430, 932], [768, 1024], [1440, 900], [1920, 1080],
];

test.describe('larguras de tela', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'roda uma vez, no projeto desktop');
  });

  for (const [w, h] of widths) {
    test(`${w}×${h}: sem rolagem horizontal e com o título visível`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/');
      await page.waitForFunction(() => !!window.__cinema, null, { timeout: 45_000 });
      await page.evaluate(() => window.__cinema!.setFloat(false));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const title = page.locator('h1');
      await expect(title).toBeInViewport();
      const box = (await title.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(w);
      await page.screenshot({ path: testInfo.outputPath(`inicio-${w}x${h}.png`) });
      // um quadro do meio da sequência em cada largura
      await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>('.cinema')!;
        window.scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * 0.45);
      });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: testInfo.outputPath(`meio-${w}x${h}.png`) });
      const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow2).toBeLessThanOrEqual(0);
    });
  }
});
