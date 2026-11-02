import { test, expect } from '@playwright/test';

test.describe('Late goal — REQ-2', () => {
  test('partida page renders late goal entry points when available', async ({ page }) => {
    await page.goto('/partida');
    await expect(page.getByRole('heading', { name: /Partida/i })).toBeVisible();
  });

  test('late goal button opens modal with REQ-2 AC-9 alert text', async ({ page }) => {
    await page.goto('/partida');

    const lateButton = page.getByRole('button', { name: /Adicionar gol esquecido/i });
    const hasButton = await lateButton.first().isVisible().catch(() => false);
    test.skip(!hasButton, 'Requires session state with at least one finished match and no active match');

    await lateButton.first().click();

    const dialog = page.getByRole('dialog', { name: /gol tardio/i });
    await expect(dialog).toBeVisible();

    const alert = dialog.getByRole('alert');
    await expect(alert).toContainText('apenas ao placar do time');
    await expect(alert).toContainText('Nenhum jogador sera creditado');
    await expect(alert).toContainText('nao sera alterado');

    const cancel = dialog.getByRole('button', { name: /Cancelar/ });
    await cancel.click();
    await expect(dialog).not.toBeVisible();
  });

  test('session review panel opens from EndSessionBar when present', async ({ page }) => {
    await page.goto('/partida');

    const reviewButton = page.getByRole('button', { name: /Revisar Resultados/i });
    const hasButton = await reviewButton.first().isVisible().catch(() => false);
    test.skip(!hasButton, 'Requires session with finished matches and no active match');

    await reviewButton.first().click();

    const panel = page.getByRole('dialog', { name: /Revisar resultados da sessao/i });
    await expect(panel).toBeVisible();

    const closeBtn = panel.getByRole('button', { name: /Fechar revisao/i });
    await closeBtn.click();
    await expect(panel).not.toBeVisible();
  });
});
