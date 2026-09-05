import { test, expect } from '@playwright/test';

/**
 * Auth smoke (demo mode): the app boots into the demo admin session, the
 * account menu exposes the admin surface, and signed-in users are redirected
 * away from the auth pages.
 */
test('demo mode session: account menu + auth redirect for signed-in users', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // The demo admin has an account menu with the admin surface.
  const account = page.getByRole('button', { name: 'Account menu' });
  await expect(account).toBeVisible();
  await account.click();
  await expect(page.getByRole('menuitem', { name: /Admin Panel/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /My Orders/i })).toBeVisible();

  // Signed-in users are bounced away from login/register to the dashboard.
  await page.goto('/login');
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto('/register');
  await expect(page).toHaveURL(/\/dashboard/);
});
