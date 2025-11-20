import { Page, expect } from "@playwright/test";

/**
 * Wait for WebSocket connection to be established
 */
export async function waitForConnection(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      const status = document.getElementById("connectionStatus");
      return status?.classList.contains("connected");
    },
    { timeout },
  );
}

/**
 * Wait for stats to load
 */
export async function waitForStats(page: Page, timeout = 5000) {
  await page.waitForFunction(
    () => {
      const uptimeValue = document.getElementById("uptimeValue");
      return uptimeValue && uptimeValue.textContent !== "--";
    },
    { timeout },
  );
}

/**
 * Wait for resources to load
 */
export async function waitForResources(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      const resourcesValue = document.getElementById("resourcesValue");
      return (
        resourcesValue &&
        resourcesValue.textContent !== "--" &&
        resourcesValue.textContent !== "0"
      );
    },
    { timeout },
  );
}

/**
 * Wait for charts to render
 */
export async function waitForCharts(page: Page, timeout = 5000) {
  await page.waitForFunction(
    () => {
      const latencyChart = document.getElementById("latencyChart");
      const resourceChart = document.getElementById("resourceChart");
      return latencyChart && resourceChart;
    },
    { timeout },
  );
}

/**
 * Switch to a specific view
 */
export async function switchView(page: Page, viewName: string) {
  await page.click(`[data-view="${viewName}"]`);
  await page.waitForTimeout(300); // Wait for animation
}

/**
 * Assert that a view is active
 */
export async function assertNavigation(page: Page, viewName: string) {
  // Check nav button is active
  const navBtn = page.locator(`[data-view="${viewName}"]`);
  await expect(navBtn).toHaveClass(/active/);

  // Check view is visible
  const view = page.locator(`#${viewName}View`);
  await expect(view).toHaveClass(/active/);
  await expect(view).toBeVisible();
}

/**
 * Get text content from an element
 */
export async function getTextContent(
  page: Page,
  selector: string,
): Promise<string> {
  const element = await page.locator(selector);
  const text = await element.textContent();
  return text?.trim() || "";
}

/**
 * Wait for modal to open
 */
export async function waitForModal(
  page: Page,
  modalId: string,
  timeout = 5000,
) {
  const modal = page.locator(`#${modalId}`);
  await expect(modal).toHaveClass(/active/, { timeout });
  await expect(modal).toBeVisible();
}

/**
 * Close active modal
 */
export async function closeModal(page: Page) {
  await page.click(".modal.active .modal-close");
  await page.waitForTimeout(300); // Wait for animation
}

/**
 * Wait for toast notification
 */
export async function waitForToast(
  page: Page,
  type?: "success" | "error" | "warning",
) {
  const selector = type ? `.toast.${type}` : ".toast";
  await page.waitForSelector(selector, { timeout: 5000 });
}

/**
 * Get all activity items
 */
export async function getActivityItems(page: Page) {
  return await page.locator(".activity-item").all();
}

/**
 * Select request type in testing view
 */
export async function selectRequestType(page: Page, type: string) {
  await page.selectOption("#requestType", type);
  await page.waitForTimeout(300); // Wait for form update
}

/**
 * Execute test in testing view
 */
export async function executeTest(page: Page) {
  await page.click("#executeTestBtn");
  await page.waitForFunction(
    () => {
      const btn = document.getElementById(
        "executeTestBtn",
      ) as HTMLButtonElement;
      return btn && !btn.disabled;
    },
    { timeout: 30000 },
  );
}

/**
 * Switch result tab in testing view
 */
export async function switchResultTab(page: Page, tabName: string) {
  await page.click(
    `.results-panel .results-tabs .tab-btn[data-tab="${tabName}"]`,
  );
  await page.waitForTimeout(200);
}

/**
 * Filter resources by search query
 */
export async function searchResources(page: Page, query: string) {
  await page.fill("#resourceSearch", query);
  await page.waitForTimeout(500); // Debounce
}

/**
 * Select category filter
 */
export async function selectCategory(page: Page, category: string) {
  await page.click(`.category-item[data-category="${category}"]`);
  await page.waitForTimeout(300);
}

/**
 * Set activity filter
 */
export async function setActivityFilter(page: Page, filter: string) {
  await page.click(`.filter-btn[data-filter="${filter}"]`);
  await page.waitForTimeout(300);
}

/**
 * Wait for resource grid to load
 */
export async function waitForResourceGrid(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      const grid = document.getElementById("resourceGrid");
      const loading = grid?.querySelector(".loading");
      return (
        grid && !loading && grid.querySelectorAll(".resource-card").length > 0
      );
    },
    { timeout },
  );
}

/**
 * Wait for categories to load
 */
export async function waitForCategories(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      const categoryList = document.getElementById("categoryList");
      const loading = categoryList?.querySelector(".loading");
      const categories = categoryList?.querySelectorAll(".category-item");
      return categoryList && !loading && categories && categories.length > 0;
    },
    { timeout },
  );
}

/**
 * Wait for providers to load
 */
export async function waitForProviders(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      const grid = document.getElementById("providersGrid");
      const loading = grid?.querySelector(".loading");
      return grid && !loading;
    },
    { timeout },
  );
}

/**
 * Check if element is visible in viewport
 */
export async function isInViewport(
  page: Page,
  selector: string,
): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }, selector);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, selector);
}

/**
 * Get computed style of element
 */
export async function getComputedStyle(
  page: Page,
  selector: string,
  property: string,
): Promise<string> {
  return await page.evaluate(
    ({ sel, prop }) => {
      const element = document.querySelector(sel);
      if (!element) return "";
      return window.getComputedStyle(element).getPropertyValue(prop);
    },
    { sel: selector, prop: property },
  );
}

/**
 * Wait for all images to load
 */
export async function waitForImages(page: Page) {
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.onload = img.onerror = resolve;
            }),
        ),
    );
  });
}

/**
 * Take screenshot with name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

/**
 * Check accessibility violations using axe-core
 */
export async function checkA11y(page: Page) {
  // This would integrate with axe-core if installed
  // For now, we'll do basic checks
  const issues: string[] = [];

  // Check for images without alt text
  const imagesWithoutAlt = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll("img"));
    return images.filter((img) => !img.alt).length;
  });
  if (imagesWithoutAlt > 0) {
    issues.push(`Found ${imagesWithoutAlt} images without alt text`);
  }

  // Check for buttons without accessible text
  const buttonsWithoutText = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons.filter(
      (btn) => !btn.textContent?.trim() && !btn.getAttribute("aria-label"),
    ).length;
  });
  if (buttonsWithoutText > 0) {
    issues.push(`Found ${buttonsWithoutText} buttons without accessible text`);
  }

  return issues;
}

/**
 * Measure page load time
 */
export async function measurePageLoadTime(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const perfData = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    return perfData.loadEventEnd - perfData.fetchStart;
  });
}

/**
 * Get network request count
 */
export async function getNetworkRequestCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return performance.getEntriesByType("resource").length;
  });
}
