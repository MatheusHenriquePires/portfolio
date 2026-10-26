import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const routes = ['/', '/projetos', '/projetos/arena-replay', '/projetos/genesis', '/projetos/jusradar', '/sobre', '/contato'];
await mkdir('.local/screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const errors = [];
const report = [];
page.on('pageerror', error => errors.push(error.message));
for (const width of [1440, 768, 390, 320]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const route of routes) {
    const response = await page.goto(base + route, { waitUntil: 'networkidle' });
    expect(response.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      font: getComputedStyle(document.querySelector('h1')).fontFamily,
      animations: getComputedStyle(document.querySelector('.core-sculpture, .system-plane')).animationName,
    }));
    expect(metrics.overflow, `Overflow ${width} ${route}`).toBe(false);
    expect(metrics.canonical).toBeTruthy();
    expect(metrics.animations).toBe('none');
    const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const violations = a11y.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }));
    const result = { width, route, ...metrics, violations };
    report.push(result);
    console.log(JSON.stringify(result));
    if (violations.length) process.exitCode = 1;
    if (width !== 320) await page.screenshot({ path: `.local/screenshots/${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}-${width}.png`, fullPage: true });
  }
}

const emailContact = await page.getByRole('button', { name: 'Continuar por e-mail' }).count() > 0;
await page.getByRole('button', { name: emailContact ? 'Continuar por e-mail' : 'Preparar mensagem' }).click();
await expect(page.locator('#contact-name:invalid')).toHaveCount(1);
await page.getByLabel('Seu nome', { exact: true }).fill('Teste de navegação');
await page.getByLabel('E-mail', { exact: true }).fill('teste@example.com');
await page.getByLabel('Sobre o projeto', { exact: true }).fill('Quero conversar sobre uma interface para meu projeto.');
if (!emailContact) {
await page.getByRole('button', { name: 'Preparar mensagem' }).click();
await expect(page.getByRole('status')).toContainText('Mensagem pronta');
await page.getByRole('button', { name: 'Copiar mensagem' }).click();
expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Quero conversar');
await expect(page.getByRole('link', { name: 'Abrir LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/matheushenriquepirrs/');
} else {
  await expect(page.locator('.contact-direct')).toHaveAttribute('href', /^mailto:/);
  await expect(page.locator('#contact-help')).toContainText('aplicativo de e-mail');
}

await page.getByRole('button', { name: 'Menu +' }).click();
await page.getByRole('navigation').getByRole('link', { name: 'Projetos', exact: true }).click();
await expect(page).toHaveURL(base + '/projetos');
await expect(page.getByRole('button', { name: 'Menu +' })).toHaveAttribute('aria-expanded', 'false');
await page.getByRole('link', { name: 'Ver projeto JusRadar' }).click();
await expect(page.locator('h1')).toHaveText('JusRadar');
await page.getByRole('link', { name: 'Conhecer case' }).click();
await expect(page.locator('h1')).toHaveText('Arena Replay');
await page.getByRole('button', { name: 'Menu +' }).click();
await page.keyboard.press('Escape');
await expect(page.getByRole('button', { name: 'Menu +' })).toBeFocused();
await expect(page.getByRole('button', { name: 'Menu +' })).toHaveAttribute('aria-expanded', 'false');

const missing = await page.goto(base + '/projetos/inexistente');
await expect(page.locator('h1')).toContainText('Essa página');
expect([200, 404]).toContain(missing.status());
await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
const sitemap = await context.request.get(base + '/sitemap.xml');
expect(await sitemap.text()).toContain('/projetos/jusradar');
expect(await sitemap.text()).not.toContain('student-sync');
expect(await sitemap.text()).not.toContain('simulados-enem');
expect((await context.request.get(base + '/robots.txt')).status()).toBe(200);
expect((await context.request.get(base + '/opengraph-image')).status()).toBe(200);

const plain = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
const plainPage = await plain.newPage();
await plainPage.goto(base);
await expect(plainPage.locator('h1')).toBeVisible();
await expect(plainPage.getByRole('link', { name: 'Ver projeto Gênesis' })).toBeVisible();
await plain.close();

const animated = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
const animatedPage = await animated.newPage();
animatedPage.on('pageerror', error => errors.push(error.message));
await animatedPage.goto(base, { waitUntil: 'networkidle' });
await expect(animatedPage.locator('.hero-system')).toHaveAttribute('data-moving', 'true');
await animatedPage.locator('#projetos').scrollIntoViewIfNeeded();
await expect(animatedPage.getByRole('link', { name: 'Ver projeto Arena Replay' })).toBeVisible();
await animated.close();

console.log(JSON.stringify({ interactions: 'passed', errors }));
expect(errors).toEqual([]);
await writeFile('.local/validation.json', JSON.stringify({ pages: report, interactions: 'passed', errors }, null, 2));
await browser.close();
