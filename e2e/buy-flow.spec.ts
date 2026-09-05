import { test, expect } from '@playwright/test';

/**
 * Storefront smoke: discover → detail → cart → checkout → confirmation.
 * Demo mode auto-signs the demo admin in, so checkout is reachable directly.
 */
test('customer buys a watch end to end', async ({ page }) => {
  await page.goto('/');

  // Landing hero paints immediately.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Featured timepieces/i })).toBeVisible();

  // Open the catalog and add the first in-stock product.
  await page.goto('/products');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page
    .getByRole('button', { name: /Add to Cart/i })
    .first()
    .click();
  await expect(page.getByText(/added to cart/i).first()).toBeVisible();

  // Quick view + compare controls exist on the first card.
  await expect(page.getByRole('button', { name: /^Quick view /i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^Compare /i }).first()).toBeVisible();

  await page.goto('/cart');
  await expect(page.getByRole('heading', { level: 1, name: /Cart/i })).toBeVisible();
  await page.getByRole('button', { name: /Proceed to Checkout/i }).click();

  // Shipping step.
  await expect(page.getByRole('heading', { level: 1, name: /Checkout/i })).toBeVisible();
  await page.getByLabel('Full name').fill('Test Shopper');
  await page.getByLabel('Phone').fill('+1 555 010 9999');
  await page.getByLabel('Address line 1').fill('1 Test Avenue');
  await page.getByLabel('City').fill('Geneva');
  await page.getByLabel('Postal code').fill('1204');
  await page.getByRole('combobox', { name: 'Country' }).click();
  await page.getByRole('option', { name: 'Switzerland' }).click();

  // Apply a promo code on the summary before paying.
  await page.getByLabel('Promo code').fill('WELCOME10');
  await page.getByRole('button', { name: /^Apply$/i }).click();
  await expect(page.getByText(/WELCOME10/).first()).toBeVisible();

  await page.getByRole('button', { name: /^Continue$/i }).click();

  // Payment step — cash on delivery avoids card fields entirely.
  await page.getByRole('radio', { name: /Cash on delivery/i }).check();
  await page.getByRole('button', { name: /^Continue$/i }).click();

  // Review step shows a discount line and places the order.
  await expect(page.getByText(/WELCOME10/i).first()).toBeVisible();
  await page.getByRole('button', { name: /^Place order/i }).click();

  // Confirmation lands on the order page.
  await expect(page).toHaveURL(/\/orders\/o\d+/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/Test Shopper/i).first()).toBeVisible();

  // The cart is empty again after checkout.
  await page.goto('/cart');
  await expect(page.getByText(/Your cart is empty/i)).toBeVisible();
});
