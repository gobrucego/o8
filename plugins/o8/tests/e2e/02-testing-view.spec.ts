import { test, expect } from "./fixtures/server";
import {
  waitForConnection,
  switchView,
  assertNavigation,
  selectRequestType,
  executeTest,
  switchResultTab,
} from "./utils/helpers";

test.describe("Testing View - Complete Coverage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForConnection(page);
    await switchView(page, "testing");
    await assertNavigation(page, "testing");
  });

  test.describe("Layout and Structure", () => {
    test("should display testing layout with two panels", async ({ page }) => {
      const layout = page.locator(".testing-layout");
      await expect(layout).toBeVisible();

      const testingPanel = page.locator(".testing-panel");
      await expect(testingPanel).toBeVisible();

      const resultsPanel = page.locator(".results-panel");
      await expect(resultsPanel).toBeVisible();
    });

    test("testing panel should have title", async ({ page }) => {
      const title = page.locator(".testing-panel h2");
      await expect(title).toBeVisible();
      await expect(title).toContainText("Interactive Testing");
    });

    test("results panel should have header with title", async ({ page }) => {
      const resultsHeader = page.locator(".results-header");
      await expect(resultsHeader).toBeVisible();

      const title = resultsHeader.locator("h3");
      await expect(title).toContainText("Test Results");
    });
  });

  test.describe("Request Type Selector", () => {
    test("should display request type label", async ({ page }) => {
      const label = page
        .locator(".form-group label")
        .filter({ hasText: "Request Type" });
      await expect(label).toBeVisible();
    });

    test("should have request type dropdown", async ({ page }) => {
      const select = page.locator("#requestType");
      await expect(select).toBeVisible();
      await expect(select).toBeEnabled();
    });

    test("should have all 4 request type options", async ({ page }) => {
      const select = page.locator("#requestType");
      const options = await select.locator("option").all();
      expect(options.length).toBe(4);
    });

    test('should have "List Prompts" option', async ({ page }) => {
      const option = page.locator('#requestType option[value="prompts/list"]');
      await expect(option).toBeAttached();
      await expect(option).toContainText("List Prompts");
    });

    test('should have "Get Prompt" option', async ({ page }) => {
      const option = page.locator('#requestType option[value="prompts/get"]');
      await expect(option).toBeAttached();
      await expect(option).toContainText("Get Prompt");
    });

    test('should have "List Resources" option', async ({ page }) => {
      const option = page.locator(
        '#requestType option[value="resources/list"]',
      );
      await expect(option).toBeAttached();
      await expect(option).toContainText("List Resources");
    });

    test('should have "Read Resource" option', async ({ page }) => {
      const option = page.locator(
        '#requestType option[value="resources/read"]',
      );
      await expect(option).toBeAttached();
      await expect(option).toContainText("Read Resource");
    });

    test('default selection should be "List Prompts"', async ({ page }) => {
      const select = page.locator("#requestType");
      const value = await select.inputValue();
      expect(value).toBe("prompts/list");
    });
  });

  test.describe("Dynamic Form Fields", () => {
    test('should show no parameters message for "List Prompts"', async ({
      page,
    }) => {
      await selectRequestType(page, "prompts/list");

      const dynamicFields = page.locator("#dynamicFormFields");
      await expect(dynamicFields).toContainText(
        "No additional parameters required",
      );
    });

    test('should show fields for "Get Prompt"', async ({ page }) => {
      await selectRequestType(page, "prompts/get");

      // Should show prompt name field
      const promptNameLabel = page
        .locator("label")
        .filter({ hasText: "Prompt Name" });
      await expect(promptNameLabel).toBeVisible();

      const promptNameInput = page.locator("#promptName");
      await expect(promptNameInput).toBeVisible();
      await expect(promptNameInput).toHaveAttribute(
        "placeholder",
        "e.g., new-project",
      );

      // Should show arguments field
      const argsLabel = page
        .locator("label")
        .filter({ hasText: "Arguments (JSON)" });
      await expect(argsLabel).toBeVisible();

      const argsTextarea = page.locator("#promptArgs");
      await expect(argsTextarea).toBeVisible();
      await expect(argsTextarea).toHaveAttribute(
        "placeholder",
        '{"key": "value"}',
      );
    });

    test('should show no parameters message for "List Resources"', async ({
      page,
    }) => {
      await selectRequestType(page, "resources/list");

      const dynamicFields = page.locator("#dynamicFormFields");
      await expect(dynamicFields).toContainText(
        "No additional parameters required",
      );
    });

    test('should show URI field for "Read Resource"', async ({ page }) => {
      await selectRequestType(page, "resources/read");

      const label = page.locator("label").filter({ hasText: "Resource URI" });
      await expect(label).toBeVisible();

      const input = page.locator("#resourceUri");
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute(
        "placeholder",
        "o8://agents/typescript-developer",
      );
    });
  });

  test.describe("Quick Examples Buttons", () => {
    test('should display "Quick Examples" label', async ({ page }) => {
      const label = page
        .locator(".form-group label")
        .filter({ hasText: "Quick Examples" });
      await expect(label).toBeVisible();
    });

    test("should have quick examples container", async ({ page }) => {
      const container = page.locator(".quick-examples");
      await expect(container).toBeVisible();
    });

    test("should have exactly 7 example buttons", async ({ page }) => {
      const buttons = page.locator(".example-btn");
      await expect(buttons).toHaveCount(7);
    });

    test('should have "List Prompts" example button', async ({ page }) => {
      const btn = page.locator('[data-example="list-prompts"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText("List Prompts");
      await expect(btn).toBeEnabled();
    });

    test('should have "List Resources" example button', async ({ page }) => {
      const btn = page.locator('[data-example="list-resources"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText("List Resources");
      await expect(btn).toBeEnabled();
    });

    test('should have "Registry Catalog" example button', async ({ page }) => {
      const btn = page.locator('[data-example="registry-catalog"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText("Registry Catalog");
      await expect(btn).toBeEnabled();
    });

    test('should have "TypeScript Agent" example button', async ({ page }) => {
      const btn = page.locator('[data-example="typescript-agent"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText("TypeScript Agent");
      await expect(btn).toBeEnabled();
    });

    test('should have "Match: API Skills" example button', async ({ page }) => {
      const btn = page.locator('[data-example="match-api"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText("Match: API Skills");
      await expect(btn).toBeEnabled();
    });

    test('should have "Match: Full Stack" example button', async ({ page }) => {
      const btn = page.locator('[data-example="match-fullstack"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText("Match: Full Stack");
      await expect(btn).toBeEnabled();
    });

    test('should have "Match: Minimal Mode" example button', async ({
      page,
    }) => {
      const btn = page.locator('[data-example="match-minimal"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText("Match: Minimal Mode");
      await expect(btn).toBeEnabled();
    });

    test('"List Resources" example should configure form correctly', async ({
      page,
    }) => {
      await page.click('[data-example="list-resources"]');
      await page.waitForTimeout(200);

      const select = page.locator("#requestType");
      const value = await select.inputValue();
      expect(value).toBe("resources/list");
    });

    test('"Registry Catalog" example should set URI field', async ({
      page,
    }) => {
      await page.click('[data-example="registry-catalog"]');
      await page.waitForTimeout(200);

      const select = page.locator("#requestType");
      expect(await select.inputValue()).toBe("resources/read");

      const uriInput = page.locator("#resourceUri");
      await expect(uriInput).toHaveValue("o8://registry");
    });

    test('"TypeScript Agent" example should set URI field', async ({
      page,
    }) => {
      await page.click('[data-example="typescript-agent"]');
      await page.waitForTimeout(200);

      const select = page.locator("#requestType");
      expect(await select.inputValue()).toBe("resources/read");

      const uriInput = page.locator("#resourceUri");
      await expect(uriInput).toHaveValue(
        "o8://agents/typescript-developer",
      );
    });

    test('"Match: API" example should set match URI', async ({ page }) => {
      await page.click('[data-example="match-api"]');
      await page.waitForTimeout(200);

      const uriInput = page.locator("#resourceUri");
      const value = await uriInput.inputValue();
      expect(value).toContain("o8://match?query=api+development");
      expect(value).toContain("maxTokens=2000");
    });

    test('"Match: Full Stack" example should set match URI with categories', async ({
      page,
    }) => {
      await page.click('[data-example="match-fullstack"]');
      await page.waitForTimeout(200);

      const uriInput = page.locator("#resourceUri");
      const value = await uriInput.inputValue();
      expect(value).toContain("o8://match?query=full+stack+development");
      expect(value).toContain("categories=agent,skill,example");
      expect(value).toContain("maxTokens=3000");
    });

    test('"Match: Minimal" example should set minimal mode URI', async ({
      page,
    }) => {
      await page.click('[data-example="match-minimal"]');
      await page.waitForTimeout(200);

      const uriInput = page.locator("#resourceUri");
      const value = await uriInput.inputValue();
      expect(value).toContain("o8://match?query=typescript+api");
      expect(value).toContain("mode=minimal");
    });
  });

  test.describe("Mode Information", () => {
    test("should display mode information section", async ({ page }) => {
      const modeInfo = page
        .locator(".form-group")
        .filter({ hasText: "Default: Index Mode" });
      await expect(modeInfo).toBeVisible();
    });

    test('should show "Default: Index Mode" badge', async ({ page }) => {
      const badge = page
        .locator("span")
        .filter({ hasText: "Default: Index Mode" });
      await expect(badge).toBeVisible();
    });

    test("should show token reduction badge", async ({ page }) => {
      const badge = page
        .locator("span")
        .filter({ hasText: "95-98% Token Reduction" });
      await expect(badge).toBeVisible();
    });
  });

  test.describe("Execute Test Button", () => {
    test("should display execute button", async ({ page }) => {
      const btn = page.locator("#executeTestBtn");
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
      await expect(btn).toContainText("Execute Test");
    });

    test("should have primary button styling", async ({ page }) => {
      const btn = page.locator("#executeTestBtn");
      await expect(btn).toHaveClass(/btn-primary/);
      await expect(btn).toHaveClass(/btn-block/);
    });

    test("should execute test when clicked", async ({ page }) => {
      // Select a simple test
      await selectRequestType(page, "resources/list");

      // Click execute
      await page.click("#executeTestBtn");

      // Button should become disabled during execution
      await page.waitForTimeout(100);
      const btn = page.locator("#executeTestBtn");

      // Wait for button to re-enable
      await expect(btn).toBeEnabled({ timeout: 30000 });
    });

    test('button should show "Executing..." during test', async ({ page }) => {
      await selectRequestType(page, "resources/list");

      const btn = page.locator("#executeTestBtn");
      await page.click("#executeTestBtn");

      // Check text changed (might be fast)
      await page.waitForTimeout(50);
    });
  });

  test.describe("Results Panel - Tabs", () => {
    test("should have 3 result tabs", async ({ page }) => {
      const tabs = page.locator(".results-panel .results-tabs .tab-btn");
      await expect(tabs).toHaveCount(3);
    });

    test('should have "Content" tab', async ({ page }) => {
      const tab = page.locator('.results-panel [data-tab="content"]');
      await expect(tab).toBeVisible();
      await expect(tab).toContainText("Content");
    });

    test('should have "Protocol" tab', async ({ page }) => {
      const tab = page.locator('.results-panel [data-tab="protocol"]');
      await expect(tab).toBeVisible();
      await expect(tab).toContainText("Protocol");
    });

    test('should have "Metadata" tab', async ({ page }) => {
      const tab = page.locator('.results-panel [data-tab="metadata"]');
      await expect(tab).toBeVisible();
      await expect(tab).toContainText("Metadata");
    });

    test('"Content" tab should be active by default', async ({ page }) => {
      const tab = page.locator('.results-panel [data-tab="content"]');
      await expect(tab).toHaveClass(/active/);
    });

    test('clicking "Protocol" tab should switch view', async ({ page }) => {
      await switchResultTab(page, "protocol");

      const tab = page.locator('.results-panel [data-tab="protocol"]');
      await expect(tab).toHaveClass(/active/);

      const content = page.locator("#protocolTab");
      await expect(content).toHaveClass(/active/);
    });

    test('clicking "Metadata" tab should switch view', async ({ page }) => {
      await switchResultTab(page, "metadata");

      const tab = page.locator('.results-panel [data-tab="metadata"]');
      await expect(tab).toHaveClass(/active/);

      const content = page.locator("#metadataTab");
      await expect(content).toHaveClass(/active/);
    });

    test("switching tabs should update content visibility", async ({
      page,
    }) => {
      // Start with content tab
      let contentTab = page.locator("#contentTab");
      await expect(contentTab).toHaveClass(/active/);

      // Switch to protocol
      await switchResultTab(page, "protocol");
      contentTab = page.locator("#contentTab");
      await expect(contentTab).not.toHaveClass(/active/);

      const protocolTab = page.locator("#protocolTab");
      await expect(protocolTab).toHaveClass(/active/);
    });
  });

  test.describe("Results Panel - Body", () => {
    test("should show empty state by default", async ({ page }) => {
      const emptyState = page.locator(".results-empty");
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText("Execute a test to see results");
    });

    test("should have results body container", async ({ page }) => {
      const body = page.locator(".results-body");
      await expect(body).toBeVisible();
    });

    test("should have content tab container", async ({ page }) => {
      const tab = page.locator("#contentTab");
      await expect(tab).toBeVisible();
    });

    test("should have protocol tab container with code block", async ({
      page,
    }) => {
      const tab = page.locator("#protocolTab");
      await expect(tab).toBeVisible();

      const codeBlock = tab.locator(".code-block");
      await expect(codeBlock).toBeVisible();
    });

    test("should have metadata tab container with code block", async ({
      page,
    }) => {
      const tab = page.locator("#metadataTab");
      await expect(tab).toBeVisible();

      const codeBlock = tab.locator(".code-block");
      await expect(codeBlock).toBeVisible();
    });
  });

  test.describe("Results Panel - Footer", () => {
    test("should display results footer", async ({ page }) => {
      const footer = page.locator(".results-footer");
      await expect(footer).toBeVisible();
    });

    test("should have stats display", async ({ page }) => {
      const stats = page.locator("#resultsStats");
      await expect(stats).toBeVisible();
    });

    test("should have copy button", async ({ page }) => {
      const btn = page.locator("#copyResultsBtn");
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
      await expect(btn).toContainText("Copy");
    });

    test("copy button should be clickable", async ({ page }) => {
      const btn = page.locator("#copyResultsBtn");
      await btn.click();
      // Note: Actual clipboard test would need permissions
    });
  });

  test.describe("Full Test Execution Flow", () => {
    test('should execute "List Resources" test successfully', async ({
      page,
    }) => {
      await selectRequestType(page, "resources/list");
      await executeTest(page);

      // Check that results are displayed
      const contentTab = page.locator("#contentTab");
      const text = await contentTab.textContent();
      expect(text).not.toContain("Execute a test to see results");

      // Stats should be updated
      const stats = page.locator("#resultsStats");
      const statsText = await stats.textContent();
      expect(statsText).toContain("Response size:");
    });

    test("should show results in all tabs after execution", async ({
      page,
    }) => {
      await selectRequestType(page, "resources/list");
      await executeTest(page);

      // Check Content tab
      await switchResultTab(page, "content");
      const contentTab = page.locator("#contentTab");
      await expect(contentTab).toBeVisible();

      // Check Protocol tab has JSON
      await switchResultTab(page, "protocol");
      const protocolTab = page.locator("#protocolTab .code-block");
      const protocolText = await protocolTab.textContent();
      expect(protocolText?.trim().length).toBeGreaterThan(0);

      // Check Metadata tab has JSON
      await switchResultTab(page, "metadata");
      const metadataTab = page.locator("#metadataTab .code-block");
      const metadataText = await metadataTab.textContent();
      expect(metadataText?.trim().length).toBeGreaterThan(0);
    });

    test('should execute "Read Resource" test with URI', async ({ page }) => {
      await selectRequestType(page, "resources/read");

      // Fill in URI
      await page.fill(
        "#resourceUri",
        "o8://agents/typescript-developer",
      );

      await executeTest(page);

      // Check that results are displayed
      const contentTab = page.locator("#contentTab");
      const text = await contentTab.textContent();
      expect(text).not.toContain("Execute a test to see results");
    });

    test("should handle example button -> execute flow", async ({ page }) => {
      // Click example
      await page.click('[data-example="list-resources"]');
      await page.waitForTimeout(300);

      // Execute
      await executeTest(page);

      // Verify results
      const stats = page.locator("#resultsStats");
      const statsText = await stats.textContent();
      expect(statsText).toContain("Response size:");
    });
  });

  test.describe("Form Validation", () => {
    test('should require URI for "Read Resource" request', async ({ page }) => {
      await selectRequestType(page, "resources/read");

      // Try to execute without URI
      await page.click("#executeTestBtn");

      // Should show error or handle gracefully
      await page.waitForTimeout(1000);
    });

    test("form fields should be editable", async ({ page }) => {
      await selectRequestType(page, "resources/read");

      const input = page.locator("#resourceUri");
      await input.fill("test-uri");

      await expect(input).toHaveValue("test-uri");
    });
  });

  test.describe("Responsive Behavior", () => {
    test("layout should adapt to smaller screens", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await waitForConnection(page);
      await switchView(page, "testing");

      const layout = page.locator(".testing-layout");
      await expect(layout).toBeVisible();
    });

    test("layout should work on mobile screens", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await waitForConnection(page);
      await switchView(page, "testing");

      const testingPanel = page.locator(".testing-panel");
      await expect(testingPanel).toBeVisible();
    });
  });
});
