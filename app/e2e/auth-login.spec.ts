import { test, expect } from '@playwright/test';

test.describe('Auth Login Flow', () => {
  test('should display login page with all elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Endereco de email')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByText('Lembrar de mim')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByText('Entrar com Google')).toBeVisible();
    await expect(page.getByText('Entrar com Apple')).toBeVisible();
    await expect(page.getByText('Esqueceu a senha?')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar' }).click();
    // The form validates on submit — empty email and password show error messages
    await expect(page.getByText('O email e obrigatorio.')).toBeVisible();
    await expect(page.getByText('A senha e obrigatoria.')).toBeVisible();
  });

  test('should show email format validation error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Endereco de email').fill('not-an-email');
    await page.getByLabel('Senha').fill('somepassword');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Formato de email invalido.')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.getByLabel('Senha');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    // Click toggle button — aria-label is "Mostrar senha" when password is hidden
    await page.getByRole('button', { name: 'Mostrar senha' }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    // Click again to hide — aria-label changes to "Ocultar senha"
    await page.getByRole('button', { name: 'Ocultar senha' }).click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Endereco de email').fill('wrong@email.com');
    await page.getByLabel('Senha').fill('wrongpassword');
    await page.getByRole('button', { name: 'Entrar' }).click();
    // The error message comes from the API or falls back to a generic message
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10_000 });
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Esqueceu a senha?').click();
    await expect(page).toHaveURL(/\/esqueceu-senha/);
  });

  test('should display MatchSoccer branding on login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('MatchSoccer')).toBeVisible();
    await expect(page.getByText('Entre com sua conta para continuar')).toBeVisible();
  });

  test('should display remember me checkbox', async ({ page }) => {
    await page.goto('/login');
    const checkbox = page.getByLabel('Lembrar de mim');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  // --- Forgot password page ---

  test('should display forgot password page elements', async ({ page }) => {
    await page.goto('/esqueceu-senha');
    await expect(page.getByText('Recuperar senha')).toBeVisible();
    await expect(page.getByText('Informe seu email e enviaremos um link para redefinir sua senha')).toBeVisible();
    await expect(page.getByLabel('Endereco de email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar link de recuperacao' })).toBeVisible();
    await expect(page.getByText('Voltar ao login')).toBeVisible();
  });

  test('should show validation error on empty forgot password submit', async ({ page }) => {
    await page.goto('/esqueceu-senha');
    await page.getByRole('button', { name: 'Enviar link de recuperacao' }).click();
    await expect(page.getByText('O email e obrigatorio.')).toBeVisible();
  });

  test('should show email format error on forgot password page', async ({ page }) => {
    await page.goto('/esqueceu-senha');
    await page.getByLabel('Endereco de email').fill('bad-email');
    await page.getByRole('button', { name: 'Enviar link de recuperacao' }).click();
    await expect(page.getByText('Formato de email invalido.')).toBeVisible();
  });

  test('should show success message on forgot password submit', async ({ page }) => {
    await page.goto('/esqueceu-senha');
    await page.getByLabel('Endereco de email').fill('test@example.com');
    await page.getByRole('button', { name: 'Enviar link de recuperacao' }).click();
    // Always shows success to avoid email enumeration
    await expect(page.getByText(/Se o email existir em nossa base/)).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate back to login from forgot password', async ({ page }) => {
    await page.goto('/esqueceu-senha');
    await page.getByText('Voltar ao login').click();
    await expect(page).toHaveURL(/\/login/);
  });

  // --- Reset password page ---

  test('should display reset password page elements with valid token', async ({ page }) => {
    await page.goto('/redefinir-senha?token=test-token');
    await expect(page.getByText('Redefinir senha')).toBeVisible();
    await expect(page.getByText('Escolha uma nova senha para sua conta')).toBeVisible();
    await expect(page.getByLabel('Nova senha')).toBeVisible();
    await expect(page.getByLabel('Confirmar nova senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Redefinir senha' })).toBeVisible();
    await expect(page.getByText('Voltar ao login')).toBeVisible();
  });

  test('should show token error when no token is provided', async ({ page }) => {
    await page.goto('/redefinir-senha');
    await expect(page.getByText(/Token de redefinicao ausente ou invalido/)).toBeVisible();
    await expect(page.getByText('Solicitar novo link')).toBeVisible();
  });

  test('should validate empty password fields on reset page', async ({ page }) => {
    await page.goto('/redefinir-senha?token=test-token');
    await page.getByRole('button', { name: 'Redefinir senha' }).click();
    await expect(page.getByText('A senha e obrigatoria.')).toBeVisible();
  });

  test('should validate minimum password length on reset page', async ({ page }) => {
    await page.goto('/redefinir-senha?token=test-token');
    await page.getByLabel('Nova senha').fill('short');
    await page.getByLabel('Confirmar nova senha').fill('short');
    await page.getByRole('button', { name: 'Redefinir senha' }).click();
    await expect(page.getByText('A senha deve ter no minimo 8 caracteres.')).toBeVisible();
  });

  test('should validate password match on reset page', async ({ page }) => {
    await page.goto('/redefinir-senha?token=test-token');
    await page.getByLabel('Nova senha').fill('newpass123');
    await page.getByLabel('Confirmar nova senha').fill('different1');
    await page.getByRole('button', { name: 'Redefinir senha' }).click();
    await expect(page.getByText('As senhas nao coincidem.')).toBeVisible();
  });

  test('should toggle password visibility on reset page', async ({ page }) => {
    await page.goto('/redefinir-senha?token=test-token');
    const newPasswordInput = page.getByLabel('Nova senha');
    await expect(newPasswordInput).toHaveAttribute('type', 'password');

    // There are two toggle buttons — first one is for "Nova senha"
    const toggleButtons = page.getByRole('button', { name: 'Mostrar senha' });
    await toggleButtons.first().click();
    await expect(newPasswordInput).toHaveAttribute('type', 'text');
  });

  test('should navigate back to login from reset password page', async ({ page }) => {
    await page.goto('/redefinir-senha?token=test-token');
    await page.getByText('Voltar ao login').click();
    await expect(page).toHaveURL(/\/login/);
  });
});
