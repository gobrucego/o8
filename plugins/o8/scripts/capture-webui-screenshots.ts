#!/usr/bin/env tsx
/**
 * Capture Web UI Screenshots for README
 * Captures high-quality screenshots of all major web UI views
 */

import { chromium, Browser, Page } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const OUTPUT_DIR = join(process.cwd(), 'docs', 'images', 'webui');
const BASE_URL = 'http://localhost:1337';

interface Screenshot {
  name: string;
  description: string;
  view?: string;
  actions?: (page: Page) => Promise<void>;
  viewport?: { width: number; height: number };
}

const screenshots: Screenshot[] = [
  {
    name: 'overview-dashboard',
    description: 'Overview dashboard with stats and charts',
    view: 'overview',
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: 'testing-view',
    description: 'Testing view interface',
    view: 'testing',
    viewport: { width: 1920, height: 1200 },
    actions: async (page) => {
      await page.waitForTimeout(1000); // Wait for view to load
    },
  },
  {
    name: 'testing-with-example',
    description: 'Testing view with example loaded',
    view: 'testing',
    viewport: { width: 1920, height: 1400 },
    actions: async (page) => {
      await page.waitForTimeout(1000);
      // Click on an example button to load a preset
      await page.click('button[data-example="match-fullstack"]');
      await page.waitForTimeout(1000);
    },
  },
  {
    name: 'resources-explorer',
    description: 'Resources explorer showing all categories',
    view: 'explorer',
    viewport: { width: 1920, height: 1200 },
    actions: async (page) => {
      await page.waitForTimeout(1500); // Wait for resources to load
    },
  },
  {
    name: 'activity-timeline',
    description: 'Activity timeline showing recent requests',
    view: 'activity',
    viewport: { width: 1920, height: 1000 },
    actions: async (page) => {
      await page.waitForTimeout(1000);
    },
  },
  {
    name: 'providers-health',
    description: 'Provider health and statistics',
    view: 'providers',
    viewport: { width: 1920, height: 1080 },
    actions: async (page) => {
      await page.waitForTimeout(1500); // Wait for provider data
    },
  },
];

async function captureScreenshot(
  browser: Browser,
  screenshot: Screenshot
): Promise<void> {
  console.log(`📸 Capturing: ${screenshot.name}`);

  const context = await browser.newContext({
    viewport: screenshot.viewport || { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    // Navigate to base URL
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for page to be ready
    await page.waitForSelector('.dashboard-header', { timeout: 10000 });

    // Switch to the specific view if needed
    if (screenshot.view) {
      await page.click(`button[data-view="${screenshot.view}"]`);
      await page.waitForTimeout(500); // Wait for view transition
    }

    // Execute custom actions if provided
    if (screenshot.actions) {
      await screenshot.actions(page);
    }

    // Additional wait to ensure everything is rendered
    await page.waitForTimeout(500);

    // Capture screenshot
    const screenshotPath = join(OUTPUT_DIR, `${screenshot.name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: false, // Capture viewport only
    });

    console.log(`✅ Saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`❌ Failed to capture ${screenshot.name}:`, error);
    throw error;
  } finally {
    await context.close();
  }
}

async function main() {
  console.log('🚀 Starting Web UI Screenshot Capture\n');

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);

  // Check if server is running
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running!');
    console.error('Please start the server with: npm run start:http');
    console.error('Or: O8_HTTP=true npm run dev\n');
    process.exit(1);
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: true, // Set to false to see the browser
  });

  try {
    // Capture all screenshots
    for (const screenshot of screenshots) {
      await captureScreenshot(browser, screenshot);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Brief pause between captures
    }

    console.log('\n✅ All screenshots captured successfully!');
    console.log(`📂 Output: ${OUTPUT_DIR}\n`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('\n❌ Screenshot capture failed:', error);
  process.exit(1);
});
