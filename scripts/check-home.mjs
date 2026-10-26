import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('.local/screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
for (const width of [1440, 768, 390, 320]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw new Error(`Horizontal overflow at ${width}`);
  await page.screenshot({ path: `.local/screenshots/home-${width}.png`, fullPage: true });
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  console.log(JSON.stringify({ width, title: await page.title(), violations: a11y.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })) }));
  if (a11y.violations.length) process.exitCode = 1;
}
await page.getByRole('button', { name: 'Menu +' }).click();
if (await page.getByRole('button', { name: 'Fechar −' }).getAttribute('aria-expanded') !== 'true') throw new Error('Menu failed to open');
await page.keyboard.press('Escape');
if (await page.getByRole('button', { name: 'Menu +' }).getAttribute('aria-expanded') !== 'false') throw new Error('Menu failed to close');
console.log(JSON.stringify({ errors, menu: 'passed' }));
if (errors.length) process.exitCode = 1;
await browser.close();
