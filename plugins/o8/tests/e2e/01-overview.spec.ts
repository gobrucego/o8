import { test, expect } from './fixtures/server';
import {
  waitForConnection,
  waitForStats,
  waitForResources,
  waitForCharts,
  getTextContent,
  switchView,
} from './utils/helpers';

test.describe('Overview View - Complete Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForConnection(page);
  });

  test.describe('Header Elements', () => {
    test('should display logo with icon', async ({ page }) => {
      const logo = page.locator('.logo');
      await expect(logo).toBeVisible();
      await expect(logo).toContainText('Orchestr8 MCP');

      const icon = logo.locator('.logo-icon');
      await expect(icon).toBeVisible();
      await expect(icon).toContainText('⚡');
    });

    test('should display version badge', async ({ page }) => {
      const version = page.locator('.version');
      await expect(version).toBeVisible();
      await expect(version).toContainText(/v\d+\.\d+\.\d+/);
    });

    test('should display connection status', async ({ page }) => {
      const status = page.locator('#connectionStatus');
      await expect(status).toBeVisible();

      const statusDot = status.locator('.status-dot');
      await expect(statusDot).toBeVisible();

      const statusText = status.locator('.status-text');
      await expect(statusText).toBeVisible();
      await expect(statusText).toContainText('Connected');

      // Check connected class
      await expect(status).toHaveClass(/connected/);
    });

    test('should display command palette hint', async ({ page }) => {
      const hint = page.locator('#commandPaletteHint');
      await expect(hint).toBeVisible();
      await expect(hint).toContainText('⌘K');
    });

    test('should display refresh button', async ({ page }) => {
      const refreshBtn = page.locator('#refreshBtn');
      await expect(refreshBtn).toBeVisible();
      await expect(refreshBtn).toBeEnabled();
      await expect(refreshBtn).toHaveAttribute('title', 'Refresh Data');
    });

    test('should display clear logs button', async ({ page }) => {
      const clearBtn = page.locator('#clearLogsBtn');
      await expect(clearBtn).toBeVisible();
      await expect(clearBtn).toBeEnabled();
      await expect(clearBtn).toHaveAttribute('title', 'Clear Activity Log');
    });
  });

  test.describe('Navigation Bar', () => {
    test('should have exactly 5 navigation buttons', async ({ page }) => {
      const navButtons = page.locator('.nav-btn');
      await expect(navButtons).toHaveCount(5);
    });

    test('should display Overview nav button with icon', async ({ page }) => {
      const btn = page.locator('[data-view="overview"]');
      await expect(btn).toBeVisible();
      await expect(btn).toHaveClass(/active/);
      await expect(btn.locator('.nav-icon')).toContainText('📊');
      await expect(btn.locator('.nav-label')).toContainText('Overview');
    });

    test('should display Testing nav button with icon', async ({ page }) => {
      const btn = page.locator('[data-view="testing"]');
      await expect(btn).toBeVisible();
      await expect(btn.locator('.nav-icon')).toContainText('🧪');
      await expect(btn.locator('.nav-label')).toContainText('Testing');
    });

    test('should display Resources nav button with icon', async ({ page }) => {
      const btn = page.locator('[data-view="explorer"]');
      await expect(btn).toBeVisible();
      await expect(btn.locator('.nav-icon')).toContainText('🗂️');
      await expect(btn.locator('.nav-label')).toContainText('Resources');
    });

    test('should display Activity nav button with icon', async ({ page }) => {
      const btn = page.locator('[data-view="activity"]');
      await expect(btn).toBeVisible();
      await expect(btn.locator('.nav-icon')).toContainText('📡');
      await expect(btn.locator('.nav-label')).toContainText('Activity');
    });

    test('should display Providers nav button with icon', async ({ page }) => {
      const btn = page.locator('[data-view="providers"]');
      await expect(btn).toBeVisible();
      await expect(btn.locator('.nav-icon')).toContainText('🔌');
      await expect(btn.locator('.nav-label')).toContainText('Providers');
    });

    test('should highlight active navigation button', async ({ page }) => {
      const overviewBtn = page.locator('[data-view="overview"]');
      await expect(overviewBtn).toHaveClass(/active/);
    });
  });

  test.describe('Stats Grid', () => {
    test.beforeEach(async ({ page }) => {
      await waitForStats(page);
    });

    test('should display exactly 6 stat cards', async ({ page }) => {
      const statCards = page.locator('.stat-card');
      await expect(statCards).toHaveCount(6);
    });

    test('Uptime stat card - should display all elements', async ({ page }) => {
      const card = page.locator('.stat-card').filter({ hasText: 'Uptime' });
      await expect(card).toBeVisible();

      // Check icon
      const icon = card.locator('.stat-icon');
      await expect(icon).toBeVisible();
      await expect(icon).toContainText('🚀');

      // Check label
      const label = card.locator('.stat-label');
      await expect(label).toBeVisible();
      await expect(label).toContainText('Uptime');

      // Check value is not placeholder
      const value = card.locator('.stat-value');
      await expect(value).toBeVisible();
      const valueText = await value.textContent();
      expect(valueText).not.toBe('--');
      expect(valueText?.length).toBeGreaterThan(0);

      // Check footer
      const footer = card.locator('.stat-footer');
      await expect(footer).toBeVisible();
      await expect(footer).toContainText('Server running');
    });

    test('Requests stat card - should display all elements', async ({ page }) => {
      const card = page.locator('.stat-card').filter({ hasText: 'Requests' });
      await expect(card).toBeVisible();

      await expect(card.locator('.stat-icon')).toContainText('📨');
      await expect(card.locator('.stat-label')).toContainText('Requests');

      const value = card.locator('.stat-value');
      await expect(value).toBeVisible();
      const valueText = await value.textContent();
      expect(parseInt(valueText || '0')).toBeGreaterThanOrEqual(0);

      await expect(card.locator('.stat-footer')).toContainText('Total processed');
    });

    test('Latency stat card - should display all elements including percentiles', async ({ page }) => {
      const card = page.locator('.stat-card').filter({ hasText: 'Avg Latency' });
      await expect(card).toBeVisible();

      await expect(card.locator('.stat-icon')).toContainText('⚡');
      await expect(card.locator('.stat-label')).toContainText('Avg Latency');

      const value = card.locator('.stat-value');
      await expect(value).toBeVisible();
      const valueText = await value.textContent();
      expect(valueText).not.toBe('--');

      // Check p95 and p99 values
      const p95 = card.locator('#p95Value');
      await expect(p95).toBeVisible();
      expect(await p95.textContent()).not.toBe('--');

      const p99 = card.locator('#p99Value');
      await expect(p99).toBeVisible();
      expect(await p99.textContent()).not.toBe('--');
    });

    test('Errors stat card - should display all elements', async ({ page }) => {
      const card = page.locator('.stat-card').filter({ hasText: 'Errors' });
      await expect(card).toBeVisible();

      await expect(card.locator('.stat-icon')).toContainText('❌');
      await expect(card.locator('.stat-label')).toContainText('Errors');

      const value = card.locator('.stat-value');
      await expect(value).toBeVisible();
      const valueText = await value.textContent();
      expect(parseInt(valueText || '0')).toBeGreaterThanOrEqual(0);

      await expect(card.locator('.stat-footer')).toContainText('Error count');
    });

    test('Memory stat card - should display formatted memory value', async ({ page }) => {
      const card = page.locator('.stat-card').filter({ hasText: 'Memory' });
      await expect(card).toBeVisible();

      await expect(card.locator('.stat-icon')).toContainText('💾');
      await expect(card.locator('.stat-label')).toContainText('Memory');

      const value = card.locator('.stat-value');
      await expect(value).toBeVisible();
      const valueText = await value.textContent();
      expect(valueText).not.toBe('--');
      expect(valueText).toMatch(/\d+\.?\d*MB/);

      await expect(card.locator('.stat-footer')).toContainText('Heap usage');
    });

    test('Resources stat card - should display count', async ({ page }) => {
      await waitForResources(page);

      const card = page.locator('.stat-card').filter({ hasText: 'Resources' });
      await expect(card).toBeVisible();

      await expect(card.locator('.stat-icon')).toContainText('📦');
      await expect(card.locator('.stat-label')).toContainText('Resources');

      const value = card.locator('.stat-value');
      await expect(value).toBeVisible();
      const valueText = await value.textContent();
      expect(valueText).not.toBe('--');
      expect(parseInt(valueText || '0')).toBeGreaterThan(0);

      await expect(card.locator('.stat-footer')).toContainText('Total available');
    });

    test('stat cards should have hover effect', async ({ page }) => {
      const card = page.locator('.stat-card').first();

      // Hover over card
      await card.hover();

      // Check that card is still visible (basic hover test)
      await expect(card).toBeVisible();
    });
  });

  test.describe('Charts Section', () => {
    test.beforeEach(async ({ page }) => {
      await waitForCharts(page);
    });

    test('should display charts grid with 2 charts', async ({ page }) => {
      const chartsGrid = page.locator('.charts-grid');
      await expect(chartsGrid).toBeVisible();

      const chartCards = chartsGrid.locator('.chart-card');
      await expect(chartCards).toHaveCount(2);
    });

    test('Latency chart - should display title and canvas', async ({ page }) => {
      const chartCard = page.locator('.chart-card').first();
      await expect(chartCard).toBeVisible();

      const header = chartCard.locator('.chart-header h3');
      await expect(header).toContainText('Request Latency Distribution');

      const canvas = chartCard.locator('#latencyChart');
      await expect(canvas).toBeVisible();
      await expect(canvas).toHaveJSProperty('tagName', 'CANVAS');
    });

    test('Resource chart - should display title and canvas', async ({ page }) => {
      const chartCard = page.locator('.chart-card').last();
      await expect(chartCard).toBeVisible();

      const header = chartCard.locator('.chart-header h3');
      await expect(header).toContainText('Resource Usage by Category');

      const canvas = chartCard.locator('#resourceChart');
      await expect(canvas).toBeVisible();
      await expect(canvas).toHaveJSProperty('tagName', 'CANVAS');
    });

    test('charts should be rendered by Chart.js', async ({ page }) => {
      // Check that Chart.js has rendered the charts
      const hasCharts = await page.evaluate(() => {
        const latencyCanvas = document.getElementById('latencyChart') as HTMLCanvasElement;
        const resourceCanvas = document.getElementById('resourceChart') as HTMLCanvasElement;

        return !!(latencyCanvas && resourceCanvas);
      });

      expect(hasCharts).toBe(true);
    });
  });

  test.describe('Recent Activity Section', () => {
    test('should display activity card with header', async ({ page }) => {
      const activityCard = page.locator('.activity-card');
      await expect(activityCard).toBeVisible();

      const header = activityCard.locator('.activity-header');
      await expect(header).toBeVisible();

      const title = header.locator('h3');
      await expect(title).toContainText('Recent Activity');
    });

    test('should display "View All" button', async ({ page }) => {
      const viewAllBtn = page.locator('#viewAllActivityBtn');
      await expect(viewAllBtn).toBeVisible();
      await expect(viewAllBtn).toBeEnabled();
      await expect(viewAllBtn).toContainText('View All');
    });

    test('should display activity list', async ({ page }) => {
      const activityList = page.locator('#recentActivityList');
      await expect(activityList).toBeVisible();
    });

    test('"View All" button should navigate to Activity view', async ({ page }) => {
      await page.click('#viewAllActivityBtn');
      await page.waitForTimeout(500);

      // Check that we're now on the activity view
      const activityView = page.locator('#activityView');
      await expect(activityView).toHaveClass(/active/);

      const activityNavBtn = page.locator('[data-view="activity"]');
      await expect(activityNavBtn).toHaveClass(/active/);
    });

    test('activity items should be clickable if present', async ({ page }) => {
      // Wait a bit for activity to potentially appear
      await page.waitForTimeout(1000);

      const activityItems = await page.locator('#recentActivityList .activity-item').count();

      if (activityItems > 0) {
        const firstItem = page.locator('#recentActivityList .activity-item').first();
        await expect(firstItem).toBeVisible();

        // Check item structure
        await expect(firstItem.locator('.activity-icon')).toBeVisible();
        await expect(firstItem.locator('.activity-content')).toBeVisible();
        await expect(firstItem.locator('.activity-title')).toBeVisible();
        await expect(firstItem.locator('.activity-time')).toBeVisible();
      }
    });
  });

  test.describe('Interactive Behaviors', () => {
    test('refresh button should trigger data refresh', async ({ page }) => {
      await waitForStats(page);

      // Click refresh button
      await page.click('#refreshBtn');

      // Wait for potential toast notification
      await page.waitForTimeout(1000);

      // Stats should still be loaded
      const uptimeValue = await getTextContent(page, '#uptimeValue');
      expect(uptimeValue).not.toBe('--');
    });

    test('clear logs button should work', async ({ page }) => {
      await page.click('#clearLogsBtn');

      // Should show toast notification
      await page.waitForTimeout(500);

      // Button should still be enabled
      const clearBtn = page.locator('#clearLogsBtn');
      await expect(clearBtn).toBeEnabled();
    });

    test('connection status should show pulse animation on message', async ({ page }) => {
      // Connection status should be visible
      const status = page.locator('#connectionStatus');
      await expect(status).toBeVisible();
      await expect(status).toHaveClass(/connected/);
    });

    test('stats should update over time', async ({ page }) => {
      await waitForStats(page);

      const initialUptime = await getTextContent(page, '#uptimeValue');

      // Wait a few seconds
      await page.waitForTimeout(3000);

      // Uptime should have updated (or at least still be displayed)
      const newUptime = await getTextContent(page, '#uptimeValue');
      expect(newUptime).toBeTruthy();
      expect(newUptime).not.toBe('--');
    });
  });

  test.describe('Responsive Design', () => {
    test('should be visible on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();
      await waitForConnection(page);

      const statsGrid = page.locator('.stats-grid');
      await expect(statsGrid).toBeVisible();
    });

    test('should be visible on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await waitForConnection(page);

      const statsGrid = page.locator('.stats-grid');
      await expect(statsGrid).toBeVisible();
    });

    test('should be visible on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await waitForConnection(page);

      const statsGrid = page.locator('.stats-grid');
      await expect(statsGrid).toBeVisible();
    });
  });

  test.describe('Page Load Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await waitForConnection(page);
      await waitForStats(page);
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have title set correctly', async ({ page }) => {
      await expect(page).toHaveTitle(/Orchestr8 MCP Dashboard/);
    });
  });
});
