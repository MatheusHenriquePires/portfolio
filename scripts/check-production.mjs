import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.portfolioMetrics = { lcp: 0, cls: 0 };
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) window.portfolioMetrics.lcp = entry.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.portfolioMetrics.cls += entry.value;
  }).observe({ type: 'layout-shift', buffered: true });
});
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const metrics = await page.evaluate(() => ({
  ...window.portfolioMetrics,
  resources: performance.getEntriesByType('resource').map(r => ({ name: new URL(r.name).pathname, bytes: r.transferSize, external: new URL(r.name).origin !== location.origin })),
}));
expect(metrics.resources.filter(r => r.external)).toEqual([]);
const routes = [];
for (const route of ['/projetos', '/projetos/arena-replay', '/projetos/genesis', '/projetos/jusradar', '/sobre', '/contato']) {
  const response = await page.goto(base + route, { waitUntil: 'networkidle' });
  expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  routes.push({ route, status: response.status() });
}
expect(errors).toEqual([]);
const report = { environment: 'Local Chrome, mobile viewport, no CPU/network throttling. Not a field performance score.', lcpMs: Math.round(metrics.lcp), cls: metrics.cls, transferKB: Math.round(metrics.resources.reduce((sum, r) => sum + r.bytes, 0) / 1024), externalRequests: 0, routes, errors };
console.log(JSON.stringify(report));
await writeFile('.local/production-validation.json', JSON.stringify(report, null, 2));
await browser.close();
