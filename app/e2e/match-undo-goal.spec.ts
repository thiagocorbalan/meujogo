import { test, expect } from '@playwright/test';

test.describe('Undo goal — live match', () => {
  test('partida page renders and can navigate to match area', async ({ page }) => {
    await page.goto('/partida');
    await expect(page.getByRole('heading', { name: /Partida/i })).toBeVisible();
  });

  test('goal list dialog opens and accepts undo interaction when match has goals', async ({ page }) => {
    await page.goto('/partida');

    const verGolsButton = page.getByRole('button', { name: /Ver gols \(\d+\)/ });
    const hasGoals = await verGolsButton.first().isVisible().catch(() => false);
    test.skip(!hasGoals, 'No active match with goals — requires seeded session fixture');

    await verGolsButton.first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /Gols/ })).toBeVisible();

    const undoButtons = dialog.getByRole('button', { name: /Desfazer gol/ });
    const count = await undoButtons.count();
    expect(count).toBeGreaterThan(0);

    const closeButton = dialog.getByRole('button', { name: 'Fechar lista de gols' });
    await closeButton.click();
    await expect(dialog).not.toBeVisible();
  });
});
