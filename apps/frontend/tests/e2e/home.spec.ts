import { test, expect } from '@playwright/test';

// Smoke test: home page renders and key UI bits exist
// Assumes baseURL is configured via playwright.config.ts (http://localhost:3000 by default)

test('home page loads and shows primary CTAs', async ({ page }) => {
  await page.goto('/', { waitUntil: 'commit' });
  // Wait for main headline to ensure hydration completed
  await expect(
    page.getByRole('heading', { name: /buy\. sell\. chat\. anywhere\./i }),
  ).toBeVisible();

  // Title headline
  await expect(
    page.getByRole('heading', { name: /buy\. sell\. chat\. anywhere\./i }),
  ).toBeVisible();

  // Primary buttons
  await expect(page.getByRole('link', { name: /post an ad/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /browse listings/i })).toBeVisible();
});
