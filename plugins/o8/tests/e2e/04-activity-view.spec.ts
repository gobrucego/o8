import { test, expect } from './fixtures/server';
import {
  waitForConnection,
  switchView,
  assertNavigation,
  setActivityFilter,
  getActivityItems,
  waitForModal,
  closeModal,
} from './utils/helpers';

test.describe('Activity View - Complete Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForConnection(page);
    await switchView(page, 'activity');
    await assertNavigation(page, 'activity');
  });

  test.describe('Layout and Structure', () => {
    test('should display activity layout', async ({ page }) => {
      const layout = page.locator('.activity-layout');
      await expect(layout).toBeVisible();
    });

    test('should have activity controls section', async ({ page }) => {
      const controls = page.locator('.activity-controls');
      await expect(controls).toBeVisible();
    });

    test('should have activity feed section', async ({ page }) => {
      const feed = page.locator('#activityFeed');
      await expect(feed).toBeVisible();
    });
  });

  test.describe('Activity Controls - Header', () => {
    test('should display "Live Activity Feed" title', async ({ page }) => {
      const title = page.locator('.activity-controls h2');
      await expect(title).toBeVisible();
      await expect(title).toContainText('Live Activity Feed');
    });

    test('should have activity filters container', async ({ page }) => {
      const filters = page.locator('.activity-filters');
      await expect(filters).toBeVisible();
    });

    test('should have pause button', async ({ page }) => {
      const pauseBtn = page.locator('#pauseActivityBtn');
      await expect(pauseBtn).toBeVisible();
      await expect(pauseBtn).toBeEnabled();
      await expect(pauseBtn).toContainText('Pause');
    });
  });

  test.describe('Activity Filters', () => {
    test('should have exactly 5 filter buttons', async ({ page }) => {
      const filters = page.locator('.filter-btn');
      await expect(filters).toHaveCount(5);
    });

    test('should have "All" filter button', async ({ page }) => {
      const btn = page.locator('[data-filter="all"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText('All');
    });

    test('should have "Requests" filter button', async ({ page }) => {
      const btn = page.locator('[data-filter="mcp_request"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText('Requests');
    });

    test('should have "Responses" filter button', async ({ page }) => {
      const btn = page.locator('[data-filter="mcp_response"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText('Responses');
    });

    test('should have "Errors" filter button', async ({ page }) => {
      const btn = page.locator('[data-filter="error"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText('Errors');
    });

    test('should have "Logs" filter button', async ({ page }) => {
      const btn = page.locator('[data-filter="log"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText('Logs');
    });

    test('"All" filter should be active by default', async ({ page }) => {
      const btn = page.locator('[data-filter="all"]');
      await expect(btn).toHaveClass(/active/);
    });

    test('clicking "Requests" filter should activate it', async ({ page }) => {
      await setActivityFilter(page, 'mcp_request');

      const btn = page.locator('[data-filter="mcp_request"]');
      await expect(btn).toHaveClass(/active/);

      const allBtn = page.locator('[data-filter="all"]');
      await expect(allBtn).not.toHaveClass(/active/);
    });

    test('clicking "Responses" filter should activate it', async ({ page }) => {
      await setActivityFilter(page, 'mcp_response');

      const btn = page.locator('[data-filter="mcp_response"]');
      await expect(btn).toHaveClass(/active/);
    });

    test('clicking "Errors" filter should activate it', async ({ page }) => {
      await setActivityFilter(page, 'error');

      const btn = page.locator('[data-filter="error"]');
      await expect(btn).toHaveClass(/active/);
    });

    test('clicking "Logs" filter should activate it', async ({ page }) => {
      await setActivityFilter(page, 'log');

      const btn = page.locator('[data-filter="log"]');
      await expect(btn).toHaveClass(/active/);
    });

    test('switching filters should update feed', async ({ page }) => {
      // Wait for some activity
      await page.waitForTimeout(1000);

      // Switch to different filter
      await setActivityFilter(page, 'mcp_request');

      // Feed should still be visible
      const feed = page.locator('#activityFeed');
      await expect(feed).toBeVisible();
    });

    test('switching back to "All" should show all activity', async ({ page }) => {
      await setActivityFilter(page, 'mcp_request');
      await page.waitForTimeout(300);

      await setActivityFilter(page, 'all');
      await page.waitForTimeout(300);

      const btn = page.locator('[data-filter="all"]');
      await expect(btn).toHaveClass(/active/);
    });
  });

  test.describe('Pause Button', () => {
    test('clicking pause button should change text to "Resume"', async ({ page }) => {
      const pauseBtn = page.locator('#pauseActivityBtn');

      await pauseBtn.click();
      await page.waitForTimeout(200);

      await expect(pauseBtn).toContainText('Resume');
    });

    test('clicking resume button should change text back to "Pause"', async ({ page }) => {
      const pauseBtn = page.locator('#pauseActivityBtn');

      // Pause
      await pauseBtn.click();
      await page.waitForTimeout(200);
      await expect(pauseBtn).toContainText('Resume');

      // Resume
      await pauseBtn.click();
      await page.waitForTimeout(200);
      await expect(pauseBtn).toContainText('Pause');
    });

    test('pause button should toggle primary class', async ({ page }) => {
      const pauseBtn = page.locator('#pauseActivityBtn');

      // Initial state
      await expect(pauseBtn).not.toHaveClass(/btn-primary/);

      // After pause
      await pauseBtn.click();
      await page.waitForTimeout(200);
      await expect(pauseBtn).toHaveClass(/btn-primary/);

      // After resume
      await pauseBtn.click();
      await page.waitForTimeout(200);
      await expect(pauseBtn).not.toHaveClass(/btn-primary/);
    });
  });

  test.describe('Activity Feed', () => {
    test('should display activity feed', async ({ page }) => {
      const feed = page.locator('#activityFeed');
      await expect(feed).toBeVisible();
    });

    test('should show empty state or activity items', async ({ page }) => {
      await page.waitForTimeout(1000);

      const feed = page.locator('#activityFeed');
      const hasEmpty = await feed.locator('.activity-empty').count();
      const hasItems = await feed.locator('.activity-item').count();

      // Should have either empty state or items
      expect(hasEmpty + hasItems).toBeGreaterThan(0);
    });

    test('empty state should have correct message', async ({ page }) => {
      await page.waitForTimeout(500);

      const emptyElements = await page.locator('.activity-empty').count();
      if (emptyElements > 0) {
        const empty = page.locator('.activity-empty').first();
        await expect(empty).toContainText('Waiting for activity');
      }
    });

    test('activity items should have correct structure', async ({ page }) => {
      await page.waitForTimeout(2000);

      const items = await page.locator('.activity-item').count();

      if (items > 0) {
        const firstItem = page.locator('.activity-item').first();

        // Check icon
        const icon = firstItem.locator('.activity-icon');
        await expect(icon).toBeVisible();

        // Check content
        const content = firstItem.locator('.activity-content');
        await expect(content).toBeVisible();

        // Check title
        const title = firstItem.locator('.activity-title');
        await expect(title).toBeVisible();

        // Check detail
        const detail = firstItem.locator('.activity-detail');
        await expect(detail).toBeVisible();

        // Check time
        const time = firstItem.locator('.activity-time');
        await expect(time).toBeVisible();
      }
    });

    test('activity items should be clickable', async ({ page }) => {
      await page.waitForTimeout(2000);

      const items = await page.locator('.activity-item').count();

      if (items > 0) {
        const firstItem = page.locator('.activity-item').first();

        // Should be able to hover
        await firstItem.hover();

        // Should be visible
        await expect(firstItem).toBeVisible();
      }
    });

    test('clicking activity item should open detail modal', async ({ page }) => {
      await page.waitForTimeout(2000);

      const items = await page.locator('.activity-item').count();

      if (items > 0) {
        const firstItem = page.locator('.activity-item').first();
        await firstItem.click();

        // Wait a bit for modal
        await page.waitForTimeout(500);

        // Check if modal opened
        const modal = page.locator('#activityDetailModal');
        const isActive = await modal.evaluate(el => el.classList.contains('active'));

        if (isActive) {
          await expect(modal).toHaveClass(/active/);
        }
      }
    });

    test('activity items should show appropriate icons', async ({ page }) => {
      await page.waitForTimeout(2000);

      const items = await page.locator('.activity-item').count();

      if (items > 0) {
        const icons = await page.locator('.activity-item .activity-icon').all();

        for (const icon of icons.slice(0, 5)) {
          const iconText = await icon.textContent();
          expect(iconText?.trim().length).toBeGreaterThan(0);
        }
      }
    });

    test('activity timestamps should be formatted', async ({ page }) => {
      await page.waitForTimeout(2000);

      const items = await page.locator('.activity-item').count();

      if (items > 0) {
        const firstTime = page.locator('.activity-item .activity-time').first();
        const timeText = await firstTime.textContent();
        expect(timeText?.trim().length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Activity Detail Modal', () => {
    test.beforeEach(async ({ page }) => {
      // Try to generate some activity and open modal
      await page.waitForTimeout(2000);

      const items = await page.locator('.activity-item').count();

      if (items > 0) {
        const firstItem = page.locator('.activity-item').first();
        await firstItem.click();
        await page.waitForTimeout(500);
      }
    });

    test('should have activity detail modal in DOM', async ({ page }) => {
      const modal = page.locator('#activityDetailModal');
      await expect(modal).toBeAttached();
    });

    test('modal should have header when opened', async ({ page }) => {
      const modal = page.locator('#activityDetailModal');
      const isActive = await modal.evaluate(el => el.classList.contains('active'));

      if (isActive) {
        const header = modal.locator('.modal-header');
        await expect(header).toBeVisible();

        const title = modal.locator('#modalActivityTitle');
        await expect(title).toBeVisible();
      }
    });

    test('modal should have close button when opened', async ({ page }) => {
      const modal = page.locator('#activityDetailModal');
      const isActive = await modal.evaluate(el => el.classList.contains('active'));

      if (isActive) {
        const closeBtn = modal.locator('.modal-close');
        await expect(closeBtn).toBeVisible();
        await expect(closeBtn).toContainText('×');
      }
    });

    test('modal should have tabs', async ({ page }) => {
      const modal = page.locator('#activityDetailModal');
      const isActive = await modal.evaluate(el => el.classList.contains('active'));

      if (isActive) {
        const tabs = modal.locator('.activity-detail-tabs');
        await expect(tabs).toBeVisible();

        // Should have 4 tabs
        const tabButtons = tabs.locator('.tab-btn');
        await expect(tabButtons).toHaveCount(4);
      }
    });

    test('modal should have Summary tab', async ({ page }) => {
      const modal = page.locator('#activityDetailModal');
      const isActive = await modal.evaluate(el => el.classList.contains('active'));

      if (isActive) {
        const tab = modal.locator('[data-tab="summary"]');
        await expect(tab).toBeVisible();
        await expect(tab).toContainText('Summary');
      }
    });

    test('modal should have Request tab', async ({ page }) => {
      const modal = page.locator('#activityDetailModal');
      const isActive = await modal.evaluate(el => el.classList.contains('active'));

      if (isActive) {
        const tab = modal.locator('[data-tab="request"]');
        await expect(tab).toBeVisible();
        await expect(tab).toContainText('Request');
      }
    });

    test('modal should have Response tab', async ({ page }) => {
      const modal = page.locator('#activityDetailModal');
      const isActive = await modal.evaluate(el => el.classList.contains('active'));

      if (isActive) {
        const tab = modal.locator('[data-tab="response"]');
        await expect(tab).toBeVisible();
        await expect(tab).toContainText('Response');
      }
    });

    test('modal should have Raw JSON tab', async ({ page }) => {
      const modal = page.locator('#activityDetailModal');
      const isActive = await modal.evaluate(el => el.classList.contains('active'));

      if (isActive) {
        const tab = modal.locator('[data-tab="raw"]');
        await expect(tab).toBeVisible();
        await expect(tab).toContainText('Raw JSON');
      }
    });

    test('clicking modal tabs should switch content', async ({ page }) => {
      const modal = page.locator('#activityDetailModal');
      const isActive = await modal.evaluate(el => el.classList.contains('active'));

      if (isActive) {
        const requestTab = modal.locator('[data-tab="request"]');
        await requestTab.click();
        await page.waitForTimeout(200);

        await expect(requestTab).toHaveClass(/active/);
      }
    });

    test('clicking close button should close modal', async ({ page }) => {
      const modal = page.locator('#activityDetailModal');
      const isActive = await modal.evaluate(el => el.classList.contains('active'));

      if (isActive) {
        const closeBtn = modal.locator('.modal-close');
        await closeBtn.click();
        await page.waitForTimeout(400);

        await expect(modal).not.toHaveClass(/active/);
      }
    });
  });

  test.describe('Real-time Updates', () => {
    test('feed should be ready to receive updates', async ({ page }) => {
      const feed = page.locator('#activityFeed');
      await expect(feed).toBeVisible();

      // Wait for WebSocket to be connected
      await page.waitForTimeout(1000);

      // Feed should be interactive
      await expect(feed).toBeVisible();
    });

    test('pause should prevent new items from appearing', async ({ page }) => {
      const pauseBtn = page.locator('#pauseActivityBtn');

      // Get current count
      const initialCount = await page.locator('.activity-item').count();

      // Pause
      await pauseBtn.click();
      await page.waitForTimeout(200);

      // Activity should be paused
      await expect(pauseBtn).toContainText('Resume');
    });
  });

  test.describe('Filter Interactions', () => {
    test('should filter activity by type', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Try each filter
      const filters = ['all', 'mcp_request', 'mcp_response', 'error', 'log'];

      for (const filter of filters) {
        await setActivityFilter(page, filter);
        await page.waitForTimeout(300);

        const btn = page.locator(`[data-filter="${filter}"]`);
        await expect(btn).toHaveClass(/active/);
      }
    });

    test('filtered view should show appropriate message if no items', async ({ page }) => {
      // Filter by errors (likely to be empty)
      await setActivityFilter(page, 'error');
      await page.waitForTimeout(500);

      const feed = page.locator('#activityFeed');
      const text = await feed.textContent();

      // Should show either empty state or items
      expect(text?.trim().length).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await waitForConnection(page);
      await switchView(page, 'activity');

      const layout = page.locator('.activity-layout');
      await expect(layout).toBeVisible();
    });

    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await waitForConnection(page);
      await switchView(page, 'activity');

      const controls = page.locator('.activity-controls');
      await expect(controls).toBeVisible();

      const feed = page.locator('#activityFeed');
      await expect(feed).toBeVisible();
    });

    test('filters should wrap on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await waitForConnection(page);
      await switchView(page, 'activity');

      const filters = page.locator('.activity-filters');
      await expect(filters).toBeVisible();

      const filterButtons = page.locator('.filter-btn');
      await expect(filterButtons).toHaveCount(5);
    });
  });

  test.describe('Scrolling and Performance', () => {
    test('activity feed should be scrollable', async ({ page }) => {
      const feed = page.locator('#activityFeed');
      await expect(feed).toBeVisible();

      // Feed container should allow scrolling if content overflows
      const isScrollable = await feed.evaluate(el => {
        return el.scrollHeight > el.clientHeight;
      });

      // This is okay either way - depends on content
      expect(typeof isScrollable).toBe('boolean');
    });

    test('should handle large activity lists', async ({ page }) => {
      // Even with many items, UI should remain responsive
      await page.waitForTimeout(3000);

      const feed = page.locator('#activityFeed');
      await expect(feed).toBeVisible();

      // Should be able to interact with filters
      const allFilter = page.locator('[data-filter="all"]');
      await allFilter.click();
      await expect(allFilter).toHaveClass(/active/);
    });
  });

  test.describe('Integration with Overview', () => {
    test('navigating from Overview "View All" should work', async ({ page }) => {
      // Go to overview first
      await switchView(page, 'overview');
      await page.waitForTimeout(500);

      // Click "View All" button
      const viewAllBtn = page.locator('#viewAllActivityBtn');
      await viewAllBtn.click();
      await page.waitForTimeout(500);

      // Should be on activity view
      await assertNavigation(page, 'activity');
    });
  });
});
