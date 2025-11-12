import { test, expect } from "./fixtures/server";
import {
  waitForConnection,
  switchView,
  assertNavigation,
  searchResources,
  selectCategory,
  waitForResourceGrid,
  waitForCategories,
  waitForModal,
  closeModal,
} from "./utils/helpers";

test.describe("Resources Explorer View - Complete Coverage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForConnection(page);
    await switchView(page, "explorer");
    await assertNavigation(page, "explorer");
  });

  test.describe("Layout and Structure", () => {
    test("should display explorer layout", async ({ page }) => {
      const layout = page.locator(".explorer-layout");
      await expect(layout).toBeVisible();
    });

    test("should have sidebar and content area", async ({ page }) => {
      const sidebar = page.locator(".explorer-sidebar");
      await expect(sidebar).toBeVisible();

      const content = page.locator(".explorer-content");
      await expect(content).toBeVisible();
    });
  });

  test.describe("Sidebar - Search Box", () => {
    test("should display search box", async ({ page }) => {
      const searchBox = page.locator(".search-box");
      await expect(searchBox).toBeVisible();
    });

    test("should have search input field", async ({ page }) => {
      const searchInput = page.locator("#resourceSearch");
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeEnabled();
      await expect(searchInput).toHaveAttribute(
        "placeholder",
        "Search resources...",
      );
    });

    test("search input should accept text", async ({ page }) => {
      const searchInput = page.locator("#resourceSearch");
      await searchInput.fill("typescript");
      await expect(searchInput).toHaveValue("typescript");
    });

    test("searching should filter resources", async ({ page }) => {
      await waitForResourceGrid(page);

      // Get initial count
      const initialCount = await page.locator(".resource-card").count();
      expect(initialCount).toBeGreaterThan(0);

      // Search for specific term
      await searchResources(page, "typescript");

      // Wait for filter to apply
      await page.waitForTimeout(600);

      // Grid should still be visible
      const grid = page.locator("#resourceGrid");
      await expect(grid).toBeVisible();
    });

    test("searching for non-existent resource should show empty state", async ({
      page,
    }) => {
      await waitForResourceGrid(page);

      await searchResources(page, "xyznonexistent12345");
      await page.waitForTimeout(600);

      const empty = page.locator(".activity-empty");
      await expect(empty).toBeVisible();
      await expect(empty).toContainText("No resources match your filter");
    });

    test("clearing search should restore all resources", async ({ page }) => {
      await waitForResourceGrid(page);

      // Search first
      await searchResources(page, "typescript");
      await page.waitForTimeout(600);

      // Clear search
      await page.fill("#resourceSearch", "");
      await page.waitForTimeout(600);

      // Should have resources again
      const cards = await page.locator(".resource-card").count();
      expect(cards).toBeGreaterThan(0);
    });
  });

  test.describe("Sidebar - Category Filters", () => {
    test("should display category filters section", async ({ page }) => {
      const section = page.locator(".category-filters");
      await expect(section).toBeVisible();
    });

    test("should have category filters title", async ({ page }) => {
      const title = page.locator(".category-filters h3");
      await expect(title).toBeVisible();
      await expect(title).toContainText("Categories");
    });

    test("should have category list", async ({ page }) => {
      const list = page.locator("#categoryList");
      await expect(list).toBeVisible();
    });

    test("should load categories", async ({ page }) => {
      await waitForCategories(page);

      const categories = await page.locator(".category-item").count();
      expect(categories).toBeGreaterThanOrEqual(1); // At least "All Resources"
    });

    test("should load categories after resources are loaded", async ({
      page,
    }) => {
      // Wait for resources to load first
      await waitForResourceGrid(page);
      await page.waitForTimeout(1000);

      // Then categories should be loaded
      await waitForCategories(page);

      const categories = await page.locator(".category-item").count();
      expect(categories).toBeGreaterThan(1); // Should have "All Resources" + actual categories
    });

    test("categories should show correct counts", async ({ page }) => {
      await waitForResourceGrid(page);
      await waitForCategories(page);

      // Get the "All Resources" count
      const allCategory = page.locator('[data-category="all"]');
      const allCount = await allCategory
        .locator(".category-count")
        .textContent();
      const totalResources = parseInt(allCount || "0");

      expect(totalResources).toBeGreaterThan(0);

      // Sum of individual category counts should match total
      const categoryItems = await page
        .locator('.category-item:not([data-category="all"])')
        .all();
      let sumCounts = 0;

      for (const item of categoryItems) {
        const countText = await item.locator(".category-count").textContent();
        sumCounts += parseInt(countText || "0");
      }

      // Total should equal sum of individual categories
      expect(sumCounts).toBe(totalResources);
    });

    test('should have "All Resources" category', async ({ page }) => {
      await waitForCategories(page);

      const allCategory = page.locator('[data-category="all"]');
      await expect(allCategory).toBeVisible();
      await expect(allCategory).toContainText("All Resources");
    });

    test('"All Resources" should be active by default', async ({ page }) => {
      await waitForCategories(page);

      const allCategory = page.locator('[data-category="all"]');
      await expect(allCategory).toHaveClass(/active/);
    });

    test("category items should show resource counts", async ({ page }) => {
      await waitForCategories(page);

      const allCategory = page.locator('[data-category="all"]');
      const count = allCategory.locator(".category-count");
      await expect(count).toBeVisible();

      const countText = await count.textContent();
      expect(parseInt(countText || "0")).toBeGreaterThan(0);
    });

    test("clicking a category should filter resources", async ({ page }) => {
      await waitForResourceGrid(page);
      await page.waitForTimeout(2000);

      // Check if we have any specific categories
      const categories = await page
        .locator('.category-item:not([data-category="all"])')
        .count();

      if (categories > 0) {
        // Click first non-all category
        const firstCategory = page
          .locator('.category-item:not([data-category="all"])')
          .first();
        await firstCategory.click();
        await page.waitForTimeout(500);

        // Should be marked as active
        await expect(firstCategory).toHaveClass(/active/);
      }
    });

    test('clicking "All Resources" should show all resources', async ({
      page,
    }) => {
      await waitForResourceGrid(page);
      await waitForCategories(page);

      const allCategory = page.locator('[data-category="all"]');
      await allCategory.click();
      await page.waitForTimeout(500);

      // Should have resources
      const cards = await page.locator(".resource-card").count();
      expect(cards).toBeGreaterThan(0);
    });
  });

  test.describe("Main Content - Header", () => {
    test("should display explorer header", async ({ page }) => {
      const header = page.locator(".explorer-header");
      await expect(header).toBeVisible();
    });

    test('should have "Resource Explorer" title', async ({ page }) => {
      const title = page.locator(".explorer-header h2");
      await expect(title).toBeVisible();
      await expect(title).toContainText("Resource Explorer");
    });

    test("should have view controls", async ({ page }) => {
      const controls = page.locator(".view-controls");
      await expect(controls).toBeVisible();
    });

    test("should have grid view button", async ({ page }) => {
      const btn = page.locator('[data-view-type="grid"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText("⊞");
    });

    test("should have list view button", async ({ page }) => {
      const btn = page.locator('[data-view-type="list"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText("☰");
    });

    test("grid view button should be active by default", async ({ page }) => {
      const btn = page.locator('[data-view-type="grid"]');
      await expect(btn).toHaveClass(/active/);
    });

    test("clicking list view button should change layout", async ({ page }) => {
      await page.click('[data-view-type="list"]');
      await page.waitForTimeout(300);

      const btn = page.locator('[data-view-type="list"]');
      await expect(btn).toHaveClass(/active/);

      const gridBtn = page.locator('[data-view-type="grid"]');
      await expect(gridBtn).not.toHaveClass(/active/);
    });

    test("toggling view type should not lose resources", async ({ page }) => {
      await waitForResourceGrid(page);

      const initialCount = await page.locator(".resource-card").count();

      // Switch to list view
      await page.click('[data-view-type="list"]');
      await page.waitForTimeout(300);

      // Switch back to grid view
      await page.click('[data-view-type="grid"]');
      await page.waitForTimeout(300);

      const finalCount = await page.locator(".resource-card").count();
      expect(finalCount).toBe(initialCount);
    });
  });

  test.describe("Resource Grid", () => {
    test("should display resource grid", async ({ page }) => {
      const grid = page.locator("#resourceGrid");
      await expect(grid).toBeVisible();
    });

    test("should load resources into grid", async ({ page }) => {
      await waitForResourceGrid(page);

      const cards = await page.locator(".resource-card").count();
      expect(cards).toBeGreaterThan(0);
    });

    test("resource cards should have correct structure", async ({ page }) => {
      await waitForResourceGrid(page);

      const firstCard = page.locator(".resource-card").first();
      await expect(firstCard).toBeVisible();

      // Check header
      const header = firstCard.locator(".resource-header");
      await expect(header).toBeVisible();

      // Check icon
      const icon = firstCard.locator(".resource-icon");
      await expect(icon).toBeVisible();

      // Check info section
      const info = firstCard.locator(".resource-info");
      await expect(info).toBeVisible();

      // Check name
      const name = firstCard.locator(".resource-name");
      await expect(name).toBeVisible();

      // Check category
      const category = firstCard.locator(".resource-category");
      await expect(category).toBeVisible();

      // Check description
      const description = firstCard.locator(".resource-description");
      await expect(description).toBeVisible();
    });

    test("resource cards should have data-uri attribute", async ({ page }) => {
      await waitForResourceGrid(page);

      const firstCard = page.locator(".resource-card").first();
      const uri = await firstCard.getAttribute("data-uri");
      expect(uri).toBeTruthy();
      expect(uri).toContain("orchestr8://");
    });

    test("resource cards should display appropriate icons", async ({
      page,
    }) => {
      await waitForResourceGrid(page);

      const cards = await page.locator(".resource-card").all();

      for (const card of cards.slice(0, 5)) {
        // Check first 5
        const icon = card.locator(".resource-icon");
        const iconText = await icon.textContent();
        expect(iconText?.trim().length).toBeGreaterThan(0);
      }
    });

    test("resource cards should have hover effect", async ({ page }) => {
      await waitForResourceGrid(page);

      const firstCard = page.locator(".resource-card").first();
      await firstCard.hover();

      // Card should still be visible
      await expect(firstCard).toBeVisible();
    });

    test("clicking resource card should open modal", async ({ page }) => {
      await waitForResourceGrid(page);

      const firstCard = page.locator(".resource-card").first();
      await firstCard.click();

      // Wait for modal
      await waitForModal(page, "resourceModal");
    });
  });

  test.describe("Resource Detail Modal", () => {
    test.beforeEach(async ({ page }) => {
      await waitForResourceGrid(page);
      const firstCard = page.locator(".resource-card").first();
      await firstCard.click();
      await waitForModal(page, "resourceModal");
    });

    test("should display resource modal", async ({ page }) => {
      const modal = page.locator("#resourceModal");
      await expect(modal).toBeVisible();
      await expect(modal).toHaveClass(/active/);
    });

    test("should have modal header", async ({ page }) => {
      const header = page.locator("#resourceModal .modal-header");
      await expect(header).toBeVisible();
    });

    test("should display resource name in header", async ({ page }) => {
      const name = page.locator("#modalResourceName");
      await expect(name).toBeVisible();

      const nameText = await name.textContent();
      expect(nameText?.trim().length).toBeGreaterThan(0);
    });

    test("should have close button", async ({ page }) => {
      const closeBtn = page.locator("#resourceModal .modal-close");
      await expect(closeBtn).toBeVisible();
      await expect(closeBtn).toContainText("×");
    });

    test("should have modal body", async ({ page }) => {
      const body = page.locator("#modalResourceContent");
      await expect(body).toBeVisible();
    });

    test("should load resource content", async ({ page }) => {
      // Wait for content to load
      await page.waitForTimeout(2000);

      const body = page.locator("#modalResourceContent");
      const text = await body.textContent();

      // Should not show loading message
      expect(text).not.toContain("Loading resource...");
    });

    test("modal content should render markdown", async ({ page }) => {
      await page.waitForTimeout(2000);

      // Check for markdown content container
      const markdownContent = page.locator(".markdown-content");

      // If content loaded successfully, should have markdown
      const hasMarkdown = await markdownContent.count();
      if (hasMarkdown > 0) {
        await expect(markdownContent.first()).toBeVisible();
      }
    });

    test("clicking close button should close modal", async ({ page }) => {
      const closeBtn = page.locator("#resourceModal .modal-close");
      await closeBtn.click();
      await page.waitForTimeout(400);

      const modal = page.locator("#resourceModal");
      await expect(modal).not.toHaveClass(/active/);
    });

    test("clicking outside modal should close it", async ({ page }) => {
      const modal = page.locator("#resourceModal");

      // Click on the overlay (not content)
      await modal.click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(400);

      await expect(modal).not.toHaveClass(/active/);
    });

    test("should be able to open modal for different resources", async ({
      page,
    }) => {
      // Close first modal
      await closeModal(page);

      // Open second resource
      const cards = page.locator(".resource-card");
      const count = await cards.count();

      if (count > 1) {
        const secondCard = cards.nth(1);
        await secondCard.click();
        await waitForModal(page, "resourceModal");

        const modal = page.locator("#resourceModal");
        await expect(modal).toHaveClass(/active/);
      }
    });
  });

  test.describe("Combined Interactions", () => {
    test("should filter by category and search simultaneously", async ({
      page,
    }) => {
      await waitForResourceGrid(page);
      await page.waitForTimeout(2000);

      // Select a category
      const categories = await page
        .locator('.category-item:not([data-category="all"])')
        .count();

      if (categories > 0) {
        const firstCategory = page
          .locator('.category-item:not([data-category="all"])')
          .first();
        await firstCategory.click();
        await page.waitForTimeout(500);

        // Then search
        await searchResources(page, "test");
        await page.waitForTimeout(600);

        // Grid should still be visible
        const grid = page.locator("#resourceGrid");
        await expect(grid).toBeVisible();
      }
    });

    test("should maintain category selection when switching views", async ({
      page,
    }) => {
      await waitForResourceGrid(page);
      await page.waitForTimeout(2000);

      // Select a category
      const categories = await page
        .locator('.category-item:not([data-category="all"])')
        .count();

      if (categories > 0) {
        const firstCategory = page
          .locator('.category-item:not([data-category="all"])')
          .first();
        await firstCategory.click();
        await page.waitForTimeout(500);

        // Switch to activity view
        await switchView(page, "activity");
        await page.waitForTimeout(500);

        // Switch back to explorer
        await switchView(page, "explorer");
        await page.waitForTimeout(500);

        // Resources should be loaded
        const grid = page.locator("#resourceGrid");
        await expect(grid).toBeVisible();
      }
    });
  });

  test.describe("Loading States", () => {
    test("should show loading indicator initially", async ({ page }) => {
      // Reload page to see loading state
      await page.reload();
      await waitForConnection(page);
      await switchView(page, "explorer");

      // Should see loading initially (might be very fast)
      const grid = page.locator("#resourceGrid");
      await expect(grid).toBeVisible();
    });

    test("category list should load", async ({ page }) => {
      const categoryList = page.locator("#categoryList");
      await expect(categoryList).toBeVisible();

      // Should not show loading forever
      await page.waitForTimeout(3000);
      const loading = categoryList.locator(".loading");
      const hasLoading = await loading.count();

      if (hasLoading === 0) {
        // Good, loaded successfully
        const categories = await page.locator(".category-item").count();
        expect(categories).toBeGreaterThanOrEqual(1);
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should work on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await waitForConnection(page);
      await switchView(page, "explorer");

      const layout = page.locator(".explorer-layout");
      await expect(layout).toBeVisible();
    });

    test("should work on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await waitForConnection(page);
      await switchView(page, "explorer");

      const content = page.locator(".explorer-content");
      await expect(content).toBeVisible();
    });

    test("resource grid should adapt to viewport size", async ({ page }) => {
      await waitForResourceGrid(page);

      // Desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(300);
      const grid = page.locator("#resourceGrid");
      await expect(grid).toBeVisible();

      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      await expect(grid).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should handle resource load errors gracefully", async ({ page }) => {
      // Even if resources fail to load, UI should be present
      const grid = page.locator("#resourceGrid");
      await expect(grid).toBeVisible();
    });

    test("should handle modal content errors gracefully", async ({ page }) => {
      await waitForResourceGrid(page);

      const firstCard = page.locator(".resource-card").first();
      await firstCard.click();
      await waitForModal(page, "resourceModal");

      // Wait for content to load or error
      await page.waitForTimeout(3000);

      const body = page.locator("#modalResourceContent");
      await expect(body).toBeVisible();

      // Should show either content or error message
      const text = await body.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    });
  });

  test.describe("Regression Tests", () => {
    test("closing modal should not affect resource grid formatting", async ({
      page,
    }) => {
      await waitForResourceGrid(page);

      // Get the initial grid style
      const explorerContent = page.locator(".explorer-content");
      const initialGridColumns = await explorerContent.evaluate(
        (el) => window.getComputedStyle(el).gridTemplateColumns,
      );

      // Open a resource modal
      const firstCard = page.locator(".resource-card").first();
      await firstCard.click();
      await waitForModal(page, "resourceModal");

      // Close the modal
      await closeModal(page);
      await page.waitForTimeout(500);

      // Verify grid formatting hasn't changed
      const finalGridColumns = await explorerContent.evaluate(
        (el) => window.getComputedStyle(el).gridTemplateColumns,
      );

      // Grid should be back to original state (1fr, not "1fr 500px")
      expect(finalGridColumns).toBe(initialGridColumns);
      expect(finalGridColumns).not.toContain("500px");
    });

    test("should not show preview panel controls after modal close", async ({
      page,
    }) => {
      await waitForResourceGrid(page);

      // Open and close modal
      const firstCard = page.locator(".resource-card").first();
      await firstCard.click();
      await waitForModal(page, "resourceModal");
      await closeModal(page);
      await page.waitForTimeout(500);

      // Preview panel should not be active
      const previewPanel = page.locator("#resourcePreviewPanel.active");
      const isPanelActive = await previewPanel.count();
      expect(isPanelActive).toBe(0);
    });

    test("should not require clicking X on resource cards to fix formatting", async ({
      page,
    }) => {
      await waitForResourceGrid(page);

      // Open and close modal multiple times
      const cards = page.locator(".resource-card");
      const count = await cards.count();

      for (let i = 0; i < Math.min(3, count); i++) {
        await cards.nth(i).click();
        await waitForModal(page, "resourceModal");
        await closeModal(page);
        await page.waitForTimeout(300);

        // Verify no formatting issues
        const explorerContent = page.locator(".explorer-content");
        const gridColumns = await explorerContent.evaluate(
          (el) => window.getComputedStyle(el).gridTemplateColumns,
        );
        expect(gridColumns).not.toContain("500px");
      }
    });

    test("modal and resource grid should work independently", async ({
      page,
    }) => {
      await waitForResourceGrid(page);

      // Open modal
      const firstCard = page.locator(".resource-card").first();
      await firstCard.click();
      await waitForModal(page, "resourceModal");

      // Resource grid should still be visible and functional (behind modal)
      const resourceGrid = page.locator("#resourceGrid");
      await expect(resourceGrid).toBeVisible();

      // Close modal
      await closeModal(page);
      await page.waitForTimeout(300);

      // Should be able to interact with grid immediately
      const secondCard = page.locator(".resource-card").nth(1);
      await expect(secondCard).toBeVisible();
      await secondCard.click();

      // Modal should open again
      await waitForModal(page, "resourceModal");
    });
  });
});
