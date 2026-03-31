import { test, expect } from '@playwright/test';

test.describe.serial('Fluxo completo da sessão', () => {
  test('Dashboard carrega com título correto', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Meu Jogo/i);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Página de Jogadores carrega com tabela visível', async ({ page }) => {
    await page.goto('/jogadores');
    await expect(page.getByRole('heading', { name: 'Jogadores' })).toBeVisible();
    await expect(page.locator('.jogadores-page, main, [class*="jogadores"]').first()).toBeVisible();
  });

  test('Página de Confirmação de Presença carrega', async ({ page }) => {
    await page.goto('/confirmacao');
    await expect(page.getByRole('heading', { name: 'Confirmação de Presença' })).toBeVisible();
  });

  test('Página de Sorteio carrega', async ({ page }) => {
    await page.goto('/sorteio');
    await expect(page.getByRole('heading', { name: 'Sorteio' })).toBeVisible();
  });

  test('Página de Partida ao Vivo carrega', async ({ page }) => {
    await page.goto('/partida');
    await expect(page.getByRole('heading', { name: /Partida/i })).toBeVisible();
  });

  test('Página de Estatísticas carrega com abas', async ({ page }) => {
    await page.goto('/estatisticas');
    await expect(page.getByRole('heading', { name: 'Estatísticas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sessão' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Temporada' })).toBeVisible();
  });

  test('Página de Campeões carrega', async ({ page }) => {
    await page.goto('/campeoes');
    await expect(page.getByRole('heading', { name: /Campe/i })).toBeVisible();
  });

  test('Página de Usuários carrega', async ({ page }) => {
    await page.goto('/usuarios');
    await expect(page.getByRole('heading', { name: /Usuário/i })).toBeVisible();
  });

  test('Página de Configurações carrega com formulário', async ({ page }) => {
    await page.goto('/configuracoes');
    await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible();
    await expect(page.locator('form, .config-page__form').first()).toBeVisible({ timeout: 10_000 });
  });
});
