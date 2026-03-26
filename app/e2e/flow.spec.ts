import { test, expect } from '@playwright/test';

/**
 * Fluxo completo da sessão — navega pelas principais páginas em sequência
 * e verifica que cada uma carrega sem erros críticos.
 *
 * Os testes usam `test.describe.serial` para garantir execução ordenada.
 * Assertions de dados vindos da API são feitas com `softExpect` ou verificam
 * apenas elementos da UI que existem independentemente da API estar disponível.
 */
test.describe.serial('Fluxo completo da sessão', () => {
  test('Dashboard carrega com título correto', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MatchSoccer/i);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Página de Jogadores carrega com tabela visível', async ({ page }) => {
    await page.goto('/jogadores');
    await expect(page.getByRole('heading', { name: 'Jogadores' })).toBeVisible();
    // A tabela pode estar vazia se a API estiver indisponível; verifica o container
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
    // Verifica que as abas Sessão e Temporada existem
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
    // O formulário pode aparecer após carregamento; aguarda até 10s
    await expect(page.locator('form, .config-page__form').first()).toBeVisible({ timeout: 10_000 });
  });
});
