import { test, expect } from '@playwright/test';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/', heading: /Dashboard/i },
  { label: 'Jogadores', href: '/jogadores', heading: /Jogadores/i },
  { label: 'Confirmação', href: '/confirmacao', heading: /Confirmação de Presença/i },
  { label: 'Sorteio', href: '/sorteio', heading: /Sorteio/i },
  { label: 'Partida ao Vivo', href: '/partida', heading: /Partida/i },
  { label: 'Estatísticas', href: '/estatisticas', heading: /Estatísticas/i },
  { label: 'Campeões', href: '/campeoes', heading: /Campe/i },
  { label: 'Usuários', href: '/usuarios', heading: /Usuário/i },
  { label: 'Configurações', href: '/configuracoes', heading: /Configurações/i },
];

test.describe('Sidebar — links e rotas', () => {
  test('Todos os links da sidebar existem e apontam para as rotas corretas', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeAttached();

    for (const { label, href } of NAV_LINKS) {
      const link = sidebar.getByRole('link', { name: label });
      await expect(link).toBeAttached();
      const linkHref = await link.getAttribute('href');
      expect(linkHref).toBe(href);
    }
  });

  for (const { label, href, heading } of NAV_LINKS) {
    test(`Link "${label}" navega para ${href} e carrega o heading correto`, async ({ page }) => {
      await page.goto('/');

      const sidebar = page.locator('.sidebar');
      const link = sidebar.getByRole('link', { name: label });
      await expect(link).toBeAttached();
      await link.click();

      await page.waitForURL(`**${href}`, { timeout: 15_000 });

      await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe('Sidebar — navegação no mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Botão hamburger abre a sidebar no mobile', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('.sidebar');
    const hamburger = page.locator('.hamburger');

    await expect(sidebar).not.toHaveClass(/\bopen\b/);

    await hamburger.click();
    await expect(sidebar).toHaveClass(/\bopen\b/);
  });

  test('Clicar em link fecha a sidebar no mobile', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('.sidebar');
    const hamburger = page.locator('.hamburger');

    await hamburger.click();
    await expect(sidebar).toHaveClass(/\bopen\b/);

    const link = sidebar.getByRole('link', { name: 'Jogadores' });
    await link.click();

    await expect(sidebar).not.toHaveClass(/\bopen\b/);

    await expect(page.getByRole('heading', { name: /Jogadores/i })).toBeVisible();
  });
});
