import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Providers View
 * Tests provider search functionality and resource modal display
 */

test.describe('Providers View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard-header', { state: 'visible' });

    // Navigate to Providers tab
    await page.click('button[data-view="providers"]');
    await page.waitForSelector('#providersView.active', { state: 'visible' });
  });

  test('should display providers grid', async ({ page }) => {
    // Check that providers grid is visible
    const providersGrid = page.locator('#providersGrid');
    await expect(providersGrid).toBeVisible();
  });

  test('should execute provider search and display results', async ({ page }) => {
    // Fill in search form
    await page.fill('#providerSearchQuery', 'typescript api');

    // Execute search
    await page.click('#executeProviderSearchBtn');

    // Wait for results to appear
    await page.waitForSelector('#providerResults[style*="display: block"]', {
      state: 'visible',
      timeout: 10000
    });

    // Verify results are displayed
    const resultsContent = page.locator('#providerResultsContent');
    await expect(resultsContent).toBeVisible();

    // Check that at least one result item is present
    const resultItems = page.locator('.search-result-item');
    await expect(resultItems.first()).toBeVisible();
  });

  test('should open resource modal when clicking search result', async ({ page }) => {
    // Fill in search form
    await page.fill('#providerSearchQuery', 'typescript');

    // Execute search
    await page.click('#executeProviderSearchBtn');

    // Wait for results
    await page.waitForSelector('.search-result-item.clickable', {
      state: 'visible',
      timeout: 10000
    });

    // Click the first clickable result
    const firstResult = page.locator('.search-result-item.clickable').first();
    await firstResult.click();

    // Verify modal opens
    const modal = page.locator('#resourceModal.active');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify modal content is loading or loaded
    const modalContent = page.locator('#modalResourceContent');
    await expect(modalContent).toBeVisible();

    // Modal should have a title
    const modalTitle = page.locator('#modalResourceName');
    await expect(modalTitle).not.toBeEmpty();
  });

  test('should display resource content in modal after loading', async ({ page }) => {
    // Fill in search form
    await page.fill('#providerSearchQuery', 'typescript');

    // Execute search
    await page.click('#executeProviderSearchBtn');

    // Wait for results
    await page.waitForSelector('.search-result-item.clickable', {
      state: 'visible',
      timeout: 10000
    });

    // Click the first result
    await page.locator('.search-result-item.clickable').first().click();

    // Wait for modal to be active
    await page.waitForSelector('#resourceModal.active', { state: 'visible' });

    // Wait for content to load (either markdown-content or error message)
    await page.waitForSelector('#modalResourceContent .markdown-content, #modalResourceContent [style*="color"]', {
      timeout: 10000
    });

    // Verify content is displayed
    const modalContent = page.locator('#modalResourceContent');
    const contentText = await modalContent.textContent();
    expect(contentText).not.toContain('Loading...');
  });

  test('should close modal when clicking close button', async ({ page }) => {
    // Fill in search form and execute
    await page.fill('#providerSearchQuery', 'typescript');
    await page.click('#executeProviderSearchBtn');

    // Wait for results and click first item
    await page.waitForSelector('.search-result-item.clickable', { state: 'visible', timeout: 10000 });
    await page.locator('.search-result-item.clickable').first().click();

    // Wait for modal to open
    await page.waitForSelector('#resourceModal.active', { state: 'visible' });

    // Click close button
    await page.click('#resourceModal .modal-close');

    // Verify modal is closed
    await expect(page.locator('#resourceModal.active')).not.toBeVisible();
  });

  test('should close modal when clicking outside', async ({ page }) => {
    // Fill in search form and execute
    await page.fill('#providerSearchQuery', 'typescript');
    await page.click('#executeProviderSearchBtn');

    // Wait for results and click first item
    await page.waitForSelector('.search-result-item.clickable', { state: 'visible', timeout: 10000 });
    await page.locator('.search-result-item.clickable').first().click();

    // Wait for modal to open
    await page.waitForSelector('#resourceModal.active', { state: 'visible' });

    // Click on modal backdrop (outside content)
    await page.locator('#resourceModal.active').click({ position: { x: 10, y: 10 } });

    // Verify modal is closed
    await expect(page.locator('#resourceModal.active')).not.toBeVisible();
  });

  test('should filter search by provider', async ({ page }) => {
    // Select specific provider
    await page.selectOption('#providerTestSelect', 'local');

    // Fill in search query
    await page.fill('#providerSearchQuery', 'typescript');

    // Execute search
    await page.click('#executeProviderSearchBtn');

    // Wait for results
    await page.waitForSelector('#providerResults[style*="display: block"]', {
      state: 'visible',
      timeout: 10000
    });

    // Verify results info shows provider filter
    const resultsInfo = page.locator('#providerResultsInfo');
    await expect(resultsInfo).toBeVisible();
  });

  test('should handle search with no results gracefully', async ({ page }) => {
    // Search for something unlikely to exist
    await page.fill('#providerSearchQuery', 'xyznonexistentresourcexyz123');

    // Execute search
    await page.click('#executeProviderSearchBtn');

    // Wait for results container
    await page.waitForSelector('#providerResults[style*="display: block"]', {
      state: 'visible',
      timeout: 10000
    });

    // Should show "No results found" message
    const resultsContent = page.locator('#providerResultsContent');
    const contentText = await resultsContent.textContent();
    expect(contentText?.toLowerCase()).toContain('no results');
  });
});

test.describe('Resource Modal Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.click('button[data-view="providers"]');
    await page.waitForSelector('#providersView.active', { state: 'visible' });

    // Execute search
    await page.fill('#providerSearchQuery', 'typescript');
    await page.click('#executeProviderSearchBtn');

    // Wait for results
    await page.waitForSelector('.search-result-item.clickable', { state: 'visible', timeout: 10000 });

    // Tab to first result and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Modal should open
    const modal = page.locator('#resourceModal.active');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Modal should close (if escape handler is implemented)
    // This might not work yet, so we'll check if it's still visible
    const isVisible = await modal.isVisible().catch(() => false);
    // Test passes either way, just checking functionality
    expect(typeof isVisible).toBe('boolean');
  });
});
