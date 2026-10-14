// Gera assets/images/og-cover.jpg a partir de tools/og-cover.html.
// Requer Playwright e o site servido em http://127.0.0.1:8130 (ver README).
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto('http://127.0.0.1:8130/tools/og-cover.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL('../assets/images/og-cover.jpg', import.meta.url).pathname, type: 'jpeg', quality: 86 });
await browser.close();
