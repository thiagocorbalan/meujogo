import { test, expect } from '@playwright/test';

test.describe('Auth RBAC UI', () => {
  test('unauthenticated user cannot access dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access jogadores', async ({ page }) => {
    await page.goto('/jogadores');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access confirmacao', async ({ page }) => {
    await page.goto('/confirmacao');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access sorteio', async ({ page }) => {
    await page.goto('/sorteio');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access partida', async ({ page }) => {
    await page.goto('/partida');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access estatisticas', async ({ page }) => {
    await page.goto('/estatisticas');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access campeoes', async ({ page }) => {
    await page.goto('/campeoes');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access usuarios', async ({ page }) => {
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access configuracoes', async ({ page }) => {
    await page.goto('/configuracoes');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user can access login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('unauthenticated user can access esqueceu-senha', async ({ page }) => {
    await page.goto('/esqueceu-senha');
    await expect(page).toHaveURL(/\/esqueceu-senha/);
    await expect(page.getByText('Recuperar senha')).toBeVisible();
  });

  test('unauthenticated user can access redefinir-senha', async ({ page }) => {
    await page.goto('/redefinir-senha?token=test');
    await expect(page).toHaveURL(/\/redefinir-senha/);
    await expect(page.getByText('Redefinir senha')).toBeVisible();
  });

  test('unauthenticated user can access auth callback', async ({ page }) => {
    await page.goto('/auth/callback');
    await expect(page).toHaveURL(/\/auth\/callback|\/login/);
  });

  test.describe('with authenticated USUARIO', () => {
    test.skip(true, 'Requires running backend with test data');

    test('USUARIO can access dashboard', async ({ page }) => {
      await page.goto('/');
      await expect(page).not.toHaveURL(/\/login/);
    });

    test('USUARIO can access jogadores', async ({ page }) => {
      await page.goto('/jogadores');
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test.describe('with authenticated ADMIN', () => {
    test.skip(true, 'Requires running backend with test data');

    test('ADMIN can access configuracoes', async ({ page }) => {
      await page.goto('/configuracoes');
      await expect(page).not.toHaveURL(/\/login/);
    });

    test('ADMIN can access usuarios', async ({ page }) => {
      await page.goto('/usuarios');
      await expect(page).not.toHaveURL(/\/login/);
    });
  });
});
