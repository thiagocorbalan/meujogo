import { test, expect } from '@playwright/test';

test.describe('Responsividade — Mobile (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Dashboard carrega e título está visível', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Cards de estatísticas estão presentes no DOM', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const statsContainer = page.locator('.dashboard__stats, [class*="stats"]').first();
    await expect(statsContainer).toBeAttached();
  });

  test('Sidebar está oculta por padrão no mobile', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeAttached();
    await expect(sidebar).not.toHaveClass(/\bopen\b/);
  });
});

test.describe('Responsividade — Tablet (820×1180)', () => {
  test.use({ viewport: { width: 820, height: 1180 } });

  test('Dashboard carrega e título está visível', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Dashboard não apresenta erros de renderização', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const jsErrors = errors.filter(
      (e) =>
        !e.includes('fetch') &&
        !e.includes('network') &&
        !e.includes('Failed to fetch') &&
        !e.includes('ECONNREFUSED'),
    );
    expect(jsErrors).toHaveLength(0);
  });

  test('Sidebar está oculta por padrão no tablet', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeAttached();
    await expect(sidebar).not.toHaveClass(/\bopen\b/);
  });
});

test.describe('Responsividade — Desktop (1280×720)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('Dashboard carrega e título está visível', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Cards de estatísticas estão presentes no DOM', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const statsContainer = page.locator('.dashboard__stats, [class*="stats"]').first();
    await expect(statsContainer).toBeAttached();
  });

  test('Sidebar está visível por padrão no desktop', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeAttached();
    await expect(sidebar.locator('.nav-link').first()).toBeVisible();
  });
});
