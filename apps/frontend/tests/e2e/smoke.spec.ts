import { test, expect } from '@playwright/test';

// P1 smoke: Home -> Browse -> Login visible; health API reachable
// This test assumes the dev server will be started by Playwright's webServer config.

test('Home to Browse flow and health endpoint', async ({ page, baseURL, request }) => {
  // Home
  await page.goto('/', { waitUntil: 'commit' });
  // Ensure hero content rendered before interacting
  await expect(page.getByRole('heading', { name: /buy\. sell\. chat\. anywhere\./i })).toBeVisible();

  // Ensure the "Browse Listings" CTA is visible and works
  const browseLink = page.getByRole('link', { name: /browse listings/i });
  await expect(browseLink).toBeVisible();
  // Assert link points to /browse (no navigation to avoid flake in dev HMR)
  await expect(browseLink).toHaveAttribute('href', '/browse');

  // Login link should be visible somewhere in the header or page
  await expect(page.getByRole('link', { name: /login/i })).toBeVisible();

  // Health endpoint reachable
  const res = await request.get(`${baseURL}/api/health`);
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.status).toBe('ok');
});
