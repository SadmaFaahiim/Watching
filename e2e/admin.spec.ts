import { test, expect } from '@playwright/test';

/**
 * Admin smoke (demo mode): the demo admin reaches order management and the
 * review moderation queue with seeded data. Route guards are unit-tested.
 */
test('demo admin manages orders and reviews', async ({ page }) => {
  await page.goto('/admin/orders');
  await expect(page.getByRole('heading', { level: 1, name: /Orders/i })).toBeVisible();

  // Expand the first order: activity timeline is present.
  const firstOrder = page.getByRole('button', { name: /#O/i }).first();
  await firstOrder.click();
  await expect(page.getByText(/Activity/i).first()).toBeVisible();

  // Review moderation lists reviews with verified badges.
  await page.goto('/admin/reviews');
  await expect(page.getByRole('heading', { level: 1, name: /Reviews/i })).toBeVisible();
  await expect(page.getByText(/Verified/i).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Remove review/i }).first()).toBeVisible();
});
