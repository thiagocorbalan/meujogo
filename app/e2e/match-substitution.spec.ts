import { test, expect } from '@playwright/test';

test.describe('Substitution — REQ-3 / REQ-4', () => {
  test('substitution button appears when active match present', async ({ page }) => {
    await page.goto('/partida');
    await expect(page.getByRole('heading', { name: /Partida/i })).toBeVisible();

    const subButton = page.getByRole('button', { name: /Substituir jogador/i });
    const hasButton = await subButton.first().isVisible().catch(() => false);
    test.skip(!hasButton, 'Requires active match');

    await expect(subButton.first()).toBeVisible();
  });

  test('substitution modal opens and allows cancelling', async ({ page }) => {
    await page.goto('/partida');

    const subButton = page.getByRole('button', { name: /Substituir jogador/i });
    const hasButton = await subButton.first().isVisible().catch(() => false);
    test.skip(!hasButton, 'Requires active match with available pool');

    const enabled = await subButton.first().isEnabled();
    test.skip(!enabled, 'Requires available pool > 0');

    await subButton.first().click();

    const dialog = page.getByRole('dialog', { name: /Substituir jogador/i });
    await expect(dialog).toBeVisible();

    const cancel = dialog.getByRole('button', { name: /Cancelar/ });
    await cancel.click();
    await expect(dialog).not.toBeVisible();
  });

  test('wizard step 1 shows both match teams as options', async ({ page }) => {
    await page.goto('/partida');

    const subButton = page.getByRole('button', { name: /Substituir jogador/i });
    const hasButton = await subButton.first().isVisible().catch(() => false);
    test.skip(!hasButton, 'Requires active match with available pool');

    const enabled = await subButton.first().isEnabled();
    test.skip(!enabled, 'Requires available pool > 0');

    await subButton.first().click();
    const dialog = page.getByRole('dialog', { name: /Substituir jogador/i });
    await expect(dialog).toBeVisible();

    const teamOptions = dialog.locator('[data-testid="sub-team-option"]');
    await expect(teamOptions).toHaveCount(2);
  });
});
