---
description: Automated web UI testing with visual testing, functional testing, accessibility validation, and performance analysis
argument-hint: [app-url-or-path]
model: claude-sonnet-4-5
---

# Test Web UI Workflow

Autonomous web UI testing that views, tests, debugs, and fixes frontend applications using browser automation and visual testing. Tests against world-class UI standards (Linear, GitHub, Vercel, VS Code) for speed, accessibility, and performance.

## Overview

This workflow provides comprehensive UI testing with autonomous issue detection and fixing:
1. Launch application and navigate UI
2. Visual testing (screenshots, layout, responsive, design system)
3. Functional testing (forms, interactions, user flows, keyboard shortcuts)
4. Accessibility testing (WCAG 2.2 AA/AAA, keyboard-first design)
5. Performance testing (Core Web Vitals, performance budget)
6. Security testing (CSP headers, XSS prevention, input validation)
7. Design system validation (typography, spacing, color contrast)
8. Debug detected issues
9. Generate automated test suites with comprehensive coverage

## Execution Instructions

### Phase 1: Application Launch & Discovery (10%)

**⚡ EXECUTE TASK TOOL:**
```
Use the fullstack-developer or frontend-developer agent to:
1. Start application locally on appropriate port
2. Verify application is running and accessible
3. Discover application structure (pages, routes, forms)
4. Map navigation structure and interactive elements
5. Identify key user flows to test

subagent_type: "orchestr8:development:fullstack-developer"
description: "Launch application and discover structure"
prompt: "Launch and discover web application: $*

Tasks:
1. **Start Application**
   - Detect application type (React/Next.js/Vue/Angular/static)
   - Start development server on appropriate port
   - Wait for application to be ready
   - Verify accessibility with curl/wget
   - Log application URL and startup time

2. **Discover Application Structure**
   - Use Playwright to crawl application
   - Discover all links and routes
   - Identify all forms and interactive elements
   - Map buttons, inputs, images
   - Intercept and log API calls
   - Detect authentication flows

3. **Map User Flows**
   - Identify critical user journeys
   - Login/signup flows
   - Main navigation paths
   - Form submission flows
   - E-commerce flows (if applicable)
   - Search functionality

Expected outputs:
- Application running on localhost
- application-structure.json with:
  - All discovered pages/routes
  - All forms with field definitions
  - All interactive elements
  - All API endpoints detected
  - Critical user flows identified
"
```

**Expected Outputs:**
- Application running and accessible
- `application-structure.json` - Complete application map
- List of critical user flows to test

**Quality Gate: Application Ready**
```bash
# Validate application is running
if ! curl -s http://localhost:3000 > /dev/null && ! curl -s http://localhost:8080 > /dev/null; then
  echo "❌ Application not accessible"
  exit 1
fi

# Validate discovery completed
if [ ! -f "application-structure.json" ]; then
  echo "❌ Application structure not discovered"
  exit 1
fi

echo "✅ Application launched and structure discovered"
```

**Track Progress:** 10% complete

**CHECKPOINT**: Application running and structure mapped ✓

---

**🚀 PARALLEL EXECUTION OPPORTUNITY (4x speedup):** Phases 2-5 (visual, functional, accessibility, performance testing) can run in parallel since each tests different aspects independently. Use a single message with 4 Task tool calls to run all test types concurrently. Each produces separate test reports (visual-test-report.md, functional-test-report.md, a11y-test-report.md, performance-test-report.md), so no conflicts.

---

### Phase 2: Visual & Design System Testing (20%)

**⚡ EXECUTE TASK TOOL:**
```
Use the visual-testing agent to:
1. Capture screenshots of all pages (mobile/tablet/desktop)
2. Perform visual regression testing
3. Check responsive design across viewports
4. Validate design system (typography, spacing, colors)
5. Test dark mode if applicable

subagent_type: "orchestr8:quality:playwright-specialist"
description: "Perform comprehensive visual and design system testing"
prompt: "Visual and design system testing for application: $*

Based on application-structure.json, perform:

1. **Visual Regression Testing**
   - Take full-page screenshots of all pages
   - Compare with baseline screenshots (if exist)
   - Use pixelmatch for pixel-level comparison
   - Detect visual regressions (>0.5% difference)
   - Generate diff images for regressions
   - Save new baselines if first run

2. **Responsive Design Testing**
   - Test on mobile viewport (375x812 - iPhone X)
   - Test on tablet viewport (768x1024 - iPad)
   - Test on desktop viewport (1920x1080)
   - Capture screenshots for each viewport
   - Detect text overflow on mobile
   - Verify mobile menu/navigation
   - Check touch target sizes (min 48px for tap targets)
   - Verify no horizontal scrollbars

3. **Design System Validation**
   - Typography: Check font usage (Inter for UI, monospace for code)
   - Type scale: Verify mathematical scale ratios (1.200 or 1.250)
   - Spacing: Validate 4px grid usage (var(--space-1) through --space-8)
   - Colors: Verify OKLCH color system usage
   - Line height: Check proportional to text size
   - Visual hierarchy: Apply blur test (readable at 5-10px Gaussian blur)
   - Button hierarchy: Primary actions identifiable in blur test

4. **Layout Integrity**
   - Measure Cumulative Layout Shift (CLS) < 0.1
   - Detect overlapping elements
   - Check for horizontal scrollbars
   - Verify z-index issues
   - Test element positioning
   - Validate grid/flexbox layouts (VS Code architecture pattern)
   - Check overflow handling

5. **Dark Mode Testing** (if applicable)
   - Toggle dark mode (data-theme=\"dark\" attribute)
   - Capture dark mode screenshots
   - Check color contrast in dark mode (4.5:1 minimum)
   - Verify all elements visible and readable
   - Test theme transitions (--transition-fast or --transition-medium)
   - Validate OKLCH colors work in dark mode

Expected outputs:
- screenshots/ directory with all captures (light and dark modes)
- .orchestr8/docs/quality/visual-test-report.md with:
  - Visual regression results
  - Design system compliance issues
  - Responsive design issues
  - Layout problems detected
  - Dark mode compatibility
  - Typography compliance
  - Spacing grid compliance
  - Color system validation
  - Blur test results
  - Diff images for any regressions
"
```

**Expected Outputs:**
- `screenshots/` directory with all screenshots
- `.orchestr8/docs/quality/visual-test-report.md` - Visual testing results
- Baseline screenshots created/updated

**Quality Gate: Visual Testing**
```bash
# Validate screenshots captured
if [ ! -d "screenshots" ] || [ -z "$(ls -A screenshots)" ]; then
  echo "❌ Screenshots not captured"
  exit 1
fi

# Validate visual report
if [ ! -f "visual-test-report.md" ]; then
  echo "❌ Visual test report not generated"
  exit 1
fi

# Check for critical regressions
if grep -q "CRITICAL" visual-test-report.md; then
  echo "⚠️  Critical visual regressions found"
fi

echo "✅ Visual and layout testing complete"
```

**Track Progress:** 20% complete

**CHECKPOINT**: Visual and layout tests complete ✓

---

### Phase 3: Functional & Keyboard Accessibility Testing (25%)

**⚡ EXECUTE TASK TOOL:**
```
Use the visual-testing agent to:
1. Test all user flows (login, forms, navigation)
2. Verify form validation
3. Test interactive elements (modals, dropdowns, drag-and-drop)
4. Test keyboard navigation and command palette
5. Verify error handling and performance

subagent_type: "orchestr8:quality:playwright-specialist"
description: "Test functional flows and keyboard-first interactions"
prompt: "Functional and keyboard accessibility testing for application: $*

Based on application-structure.json, test:

1. **Keyboard-First Navigation** (Speed & Keyboard-First Design)
   - Tab through all interactive elements
   - Verify logical tab order (left-to-right, top-to-bottom)
   - Check visible focus indicators on all elements
   - Test escape key closes dialogs/modals (focus trap)
   - Verify all actions doable via keyboard (no mouse-only flows)
   - Test enter/space for button activation
   - Test arrow keys for menu navigation
   - Verify no keyboard traps

2. **Command Palette Testing** (if applicable)
   - Test ⌘+K (Mac) / Ctrl+K (Windows/Linux) opens command palette
   - Search functionality works (real-time filtering)
   - Keyboard navigation in results (arrow up/down)
   - Enter selects highlighted item
   - Escape closes palette
   - Check keyboard shortcuts documented with commands

3. **Authentication Flows**
   - Test login with valid credentials (keyboard only)
   - Test login with invalid credentials
   - Verify helpful error messages displayed
   - Test signup/registration flow (all keyboard accessible)
   - Test password reset flow
   - Verify session persistence
   - Test logout functionality
   - Measure login time < 100ms interaction feedback

4. **Form Validation & Performance**
   - Submit forms with empty fields (immediate feedback)
   - Verify required field validation (real-time if possible)
   - Test invalid email formats
   - Test invalid phone numbers
   - Test password strength validation
   - Verify error messages clear and helpful
   - Test field character limits with visual feedback
   - Measure form interaction response < 100ms

5. **Interactive Elements (Task-Oriented UI)**
   - Test modal open/close (button, X, escape, outside click)
   - Verify focus trap in modals (tab cycles within modal)
   - Test dropdown menus (keyboard navigation)
   - Test tabs and accordions (arrow keys work)
   - Test drag-and-drop functionality
   - Test tooltips and popovers
   - Test date pickers with keyboard navigation
   - Test file uploads with clear drag-drop targets
   - Measure all interactions < 100ms

6. **Search & Filtering (with Progressive Disclosure)**
   - Test search with various queries (debounced, real-time results)
   - Verify search results display immediately
   - Test empty search results (helpful message)
   - Test filtering options with smart defaults
   - Test sorting functionality
   - Test pagination (keyboard accessible)
   - Measure search response < 100ms from keystroke

7. **Navigation & Routing**
   - Test all internal links
   - Verify correct page loads
   - Test browser back/forward
   - Test deep linking
   - Verify 404 page handling
   - Test responsive navigation (mobile menu)

8. **Accessibility & Inclusivity**
   - Verify all form inputs have associated labels
   - Check error messages link to problem fields
   - Test with keyboard only (no mouse at all)
   - Verify page structure logical without CSS
   - Check for sufficient color contrast

Expected outputs:
- .orchestr8/docs/quality/functional-test-report.md with:
  - Keyboard navigation results (all flows tested)
  - Command palette functionality (if exists)
  - User flow pass/fail status
  - Interaction response times (all < 100ms)
  - Errors/bugs detected
  - Screenshots of failures
  - Steps to reproduce issues
  - Keyboard shortcut inventory
  - Accessibility issues for remediation
"
```

**Expected Outputs:**
- `.orchestr8/docs/quality/functional-test-report.md` - Functional testing results
- Screenshots of any failures
- Detailed reproduction steps for bugs

**Quality Gate: Functional Testing**
```bash
# Validate functional report
if [ ! -f "functional-test-report.md" ]; then
  echo "❌ Functional test report not generated"
  exit 1
fi

# Check for critical failures
FAILURES=$(grep -c "FAIL" functional-test-report.md || echo "0")
if [ "$FAILURES" -gt 0 ]; then
  echo "⚠️  $FAILURES functional test failures detected"
fi

echo "✅ Functional testing complete"
```

**Track Progress:** 45% complete

**CHECKPOINT**: Functional tests complete ✓

---

### Phase 4: Accessibility & Inclusivity Audit (20%)

**⚡ EXECUTE TASK TOOL:**
```
Use the accessibility-tester agent to:
1. Run axe-core accessibility audit (WCAG 2.2 AA)
2. Verify keyboard-first design principles
3. Check color contrast with design system values
4. Validate ARIA patterns and semantic HTML
5. Test assistive technology compatibility

subagent_type: "orchestr8:quality:playwright-specialist"
description: "Comprehensive accessibility audit with inclusivity focus"
prompt: "Accessibility and inclusivity testing for application: $*

Perform comprehensive accessibility audit to WCAG 2.2 AA standards:

1. **WCAG 2.2 AA Compliance** (Latest Standard)
   - Run axe-core on all pages
   - Detect violations by severity (critical/serious/moderate/minor)
   - Check all 4 WCAG principles:
     - Perceivable: alt text, captions, adaptable content
     - Operable: keyboard accessible, enough time, seizure prevention
     - Understandable: readable, predictable, input assistance
     - Robust: compatible with assistive technology
   - Generate detailed violation reports with remediation steps
   - Calculate overall accessibility score (0-100)

2. **Keyboard-First Design Validation**
   - Tab through all interactive elements (must be keyboard accessible)
   - Verify logical tab order (left-to-right, top-to-bottom)
   - Check visible focus indicators (3:1 contrast minimum)
   - Test keyboard shortcuts consistency and documentation
   - Verify no keyboard traps (always escape path)
   - Test focus management in modals (focus trap, restore on close)
   - Test with keyboard only (no mouse allowed)
   - Measure interaction response time < 100ms
   - Verify skip links exist and work

3. **Color Contrast & Visual Design**
   - Validate text contrast minimum 4.5:1 (normal text)
   - Validate large text contrast minimum 3:1 (18pt or bold 14pt+)
   - Check UI component contrast (borders, icons) 3:1 minimum
   - Test dark mode contrast (if applicable)
   - Verify color not only differentiator (patterns, text, icons)
   - Check focus indicator contrast (3:1 minimum)
   - Validate against OKLCH color system if used
   - Use Color Contrast Analyzer tool for verification

4. **Semantic HTML & ARIA Patterns**
   - Check semantic HTML usage (nav, main, aside, footer, article)
   - Verify correct heading hierarchy (h1-h6, no skips)
   - Check landmark regions present (header, nav, main, footer)
   - Verify form labels associated with inputs (for= attribute)
   - Test ARIA patterns for complex components (combobox, tabs, menus)
   - Check aria-label/aria-labelledby on unlabeled buttons
   - Verify aria-required on required fields
   - Check aria-invalid/aria-describedby on error fields
   - Validate ARIA attribute values (allowed values)
   - Test image alt text quality (descriptive, not \"image of...\")

5. **Screen Reader Compatibility**
   - Test with screen reader (NVDA, JAWS simulation)
   - Verify page structure announced correctly
   - Check button purposes announced clearly
   - Test form field labels and descriptions
   - Verify live regions for dynamic content (aria-live)
   - Check error announcements clear and helpful
   - Test success messages announced (aria-live=\"polite\")
   - Verify skip navigation works
   - Check landmark navigation available

6. **Form Accessibility & Error Handling**
   - Verify all inputs have labels
   - Check error message association (aria-describedby)
   - Test required field indicators (visual + aria-required)
   - Verify fieldset/legend for grouped inputs
   - Check autocomplete attributes present
   - Test error messages describe problem clearly
   - Verify real-time validation doesn't trap users
   - Check form instructions visible and associated

7. **Mobile & Touch Accessibility**
   - Touch target size minimum 48px × 48px
   - Verify zoom works (minimum 200% zoom)
   - Check text resizing works (up to 200%)
   - Test with mobile screen reader (VoiceOver, TalkBack)
   - Verify responsive layout doesn't hide functionality
   - Check orientation support (portrait and landscape)
   - Test with browser extensions disabled

Expected outputs:
- .orchestr8/docs/accessibility/audit.md with:
  - WCAG 2.2 AA compliance level achieved
  - All violations by severity with remediation steps
  - Affected elements and line numbers
  - Accessibility score (0-100)
  - Keyboard navigation test results
  - Focus management verification
  - Color contrast report with specific issues
  - Screen reader compatibility notes
  - Touch target size violations (if any)
  - Recommendations for improvements
  - Checklist for quick remediation
"
```

**Expected Outputs:**
- `.orchestr8/docs/accessibility/audit.md` - Comprehensive accessibility audit
- List of violations with remediation steps
- Accessibility score

**Quality Gate: Accessibility**
```bash
# Validate accessibility report
if [ ! -f "accessibility-report.md" ]; then
  echo "❌ Accessibility report not generated"
  exit 1
fi

# Check for critical violations
CRITICAL=$(grep -c "CRITICAL" accessibility-report.md || echo "0")
if [ "$CRITICAL" -gt 0 ]; then
  echo "❌ $CRITICAL critical accessibility violations found"
  exit 1
fi

# Check for serious violations
SERIOUS=$(grep -c "SERIOUS" accessibility-report.md || echo "0")
if [ "$SERIOUS" -gt 5 ]; then
  echo "⚠️  $SERIOUS serious accessibility violations found"
fi

echo "✅ Accessibility testing complete"
```

**Track Progress:** 65% complete

**CHECKPOINT**: Accessibility tests complete ✓

---

### Phase 5: Performance & Bundle Size Testing (15%)

**⚡ EXECUTE TASK TOOL:**
```
Use the performance-analyzer agent to:
1. Measure Core Web Vitals against design system targets
2. Validate performance budget (initial bundle < 300KB)
3. Check interaction response times (< 100ms)
4. Analyze page load performance
5. Detect performance bottlenecks and opportunities

subagent_type: "orchestr8:quality:load-testing-specialist"
description: "Analyze web performance and performance budget"
prompt: "Performance testing for application: $*

Measure and analyze performance against world-class standards:

1. **Core Web Vitals with World-Class Targets**
   - Largest Contentful Paint (LCP) - target <2.5s (web-ui-generator: <2.5s)
   - First Input Delay (FID) / Interaction to Next Paint (INP) - target <100ms
   - Cumulative Layout Shift (CLS) - target <0.1 (strict)
   - First Contentful Paint (FCP) - target <1.8s
   - Time to Interactive (TTI) - target <3.8s
   - Measure on all key pages (multiple runs)
   - Calculate p75 percentile (75th percentile is the metric)
   - Compare against targets and flag violations

2. **Performance Budget Validation**
   - Initial bundle size target: <300KB (web-ui-generator spec)
   - JavaScript bundle: measure minified + gzipped
   - CSS bundle: measure minified + gzipped
   - Asset sizes: images, fonts, videos
   - Total page weight on first load
   - Identify files exceeding budget
   - Recommend code splitting for large bundles

3. **Interaction Response Time** (Speed is a Feature)
   - Measure ALL interactive elements:
     - Button clicks: should feel instant (<100ms visual feedback)
     - Form input: real-time validation feedback
     - Search: debounced, <100ms from keystroke to results
     - Menu open/close: smooth transitions
     - Modal open: immediate visual response
   - Flag any interaction > 100ms visual feedback
   - Measure with Chrome DevTools Performance tab

4. **Page Load Performance**
   - Measure total page load time (DOMContentLoaded, Load)
   - Break down by resource types (JS, CSS, fonts, images)
   - Identify render-blocking resources (critical path)
   - Check resource sizes and count
   - Verify gzip/brotli compression enabled
   - Test cache headers (Cache-Control, ETag)
   - Measure DNS/TCP/SSL time (connection metrics)
   - Check for unused polyfills or libraries
   - Verify critical fonts preloaded (Inter font)

5. **JavaScript & CSS Coverage (Unused Code)**
   - Enable code coverage in Chrome DevTools
   - Measure unused JavaScript percentage
   - Measure unused CSS percentage
   - Calculate coverage percentages
   - Identify large bundles > 100KB
   - Suggest code splitting opportunities:
     - Route-based splitting (per page)
     - Component-level splitting (lazy load heavy components)
     - Vendor splitting (separate vendor bundle)
   - Check for dead code

6. **Performance Bottlenecks & Optimization**
   - Profile JavaScript execution (long tasks > 50ms)
   - Identify main thread blocking operations
   - Check for memory leaks (heap snapshots)
   - Measure bundle sizes (sourcemap analysis)
   - Check image optimization:
     - WebP/AVIF formats
     - Responsive images (srcset)
     - Lazy loading (loading=\"lazy\")
     - Image compression (< 100KB per image)
   - Verify font optimization:
     - Font file size and formats (woff2)
     - Font loading strategy (font-display: swap)
     - Variable fonts (reduce total size)
   - Verify lazy loading implementation:
     - Components below fold
     - Heavy components
     - Routes (dynamic imports)

7. **Lighthouse Audit (Comprehensive)**
   - Run Lighthouse performance audit (desktop)
   - Run Lighthouse performance audit (mobile)
   - Capture performance score (0-100, target >90)
   - Capture accessibility score (target 100)
   - Capture best practices score
   - Capture SEO score
   - Review all recommendations (quick wins prioritized)
   - Identify opportunities section
   - Check diagnostics section

Expected outputs:
- .orchestr8/docs/performance/analysis.md with:
  - Core Web Vitals results with compliance status (pass/fail vs targets)
  - Performance budget status (actual vs 300KB target)
  - Interaction response times (all < 100ms check)
  - Lighthouse scores (mobile + desktop)
  - Bottlenecks identified with severity
  - Code coverage percentages
  - Bundle size breakdown
  - Resource analysis (fonts, images, third-party)
  - Memory leak detection results
  - Optimization recommendations (prioritized by impact)
  - Before/after comparisons (if re-testing)
  - Performance tracking baseline for future runs
"
```

**Expected Outputs:**
- `.orchestr8/docs/performance/analysis.md` - Performance analysis
- Core Web Vitals measurements
- Optimization recommendations

**Quality Gate: Performance**
```bash
# Validate performance report
if [ ! -f "performance-report.md" ]; then
  echo "❌ Performance report not generated"
  exit 1
fi

# Check Core Web Vitals (simplified)
if grep -q "LCP.*[3-9][0-9][0-9][0-9]ms" performance-report.md; then
  echo "⚠️  LCP exceeds 2500ms target"
fi

if grep -q "CLS.*0\.[2-9]" performance-report.md; then
  echo "⚠️  CLS exceeds 0.1 target"
fi

echo "✅ Performance testing complete"
```

**Track Progress:** 80% complete

**CHECKPOINT**: Performance tests complete ✓

---

### Phase 5.5: Security Headers & CSP Validation (5%)

**⚡ EXECUTE TASK TOOL:**
```
Use the security-auditor agent to:
1. Validate security headers (CSP, X-Frame-Options, etc.)
2. Check Content Security Policy configuration
3. Verify XSS prevention measures
4. Test input validation and sanitization
5. Check for exposed sensitive data

subagent_type: "orchestr8:quality:security-auditor"
description: "Security headers and CSP validation"
prompt: "Security headers and CSP testing for application: $*

Validate security configuration:

1. **Security Headers**
   - Content-Security-Policy (CSP): Verify strict configuration
     - default-src 'self' (restrictive by default)
     - script-src with nonce or hashes (no 'unsafe-inline')
     - style-src configured (no 'unsafe-inline' if possible)
     - img-src, font-src, connect-src configured
     - Report-URI or report-to configured
   - X-Frame-Options: DENY or SAMEORIGIN (prevent clickjacking)
   - X-Content-Type-Options: nosniff (prevent MIME sniffing)
   - X-XSS-Protection: 0 (prefer CSP, but can be set)
   - Referrer-Policy: strict-no-referrer or no-referrer (privacy)
   - Permissions-Policy (formerly Feature-Policy): restrictive
   - Strict-Transport-Security (HSTS): present if HTTPS

2. **Input Validation & XSS Prevention**
   - Check for DOMPurify or similar HTML sanitization
   - Verify dangerouslySetInnerHTML usage (never without sanitization)
   - Check template escaping in frameworks
   - Test with XSS payloads:
     - <script>alert('xss')</script>
     - <img src=x onerror=alert('xss')>
     - <svg onload=alert('xss')>
   - Verify form inputs sanitized
   - Check stored XSS (database retrieval)
   - Test Reflected XSS patterns

3. **Form Security**
   - Verify CSRF tokens on state-changing operations (POST, PUT, DELETE)
   - Check CORS configuration (not overly permissive)
   - Verify secure flag on sensitive cookies
   - Check HttpOnly flag on session cookies
   - Test with tampered CSRF tokens (should fail)
   - Check SameSite attribute on cookies

4. **Data Exposure**
   - Check for hardcoded secrets (API keys, passwords)
   - Verify PII not logged or exposed
   - Check error messages don't expose sensitive info
   - Verify debug information not exposed
   - Test with intercepted requests (no exposed secrets)
   - Check source maps don't expose sensitive code paths

5. **Authentication & Authorization**
   - Verify authentication required where needed
   - Check authorization enforced properly
   - Test with tampered JWT tokens (if used)
   - Verify session invalidation on logout
   - Check password reset links are one-time use
   - Verify rate limiting on login/password reset

Expected outputs:
- .orchestr8/docs/security/headers-audit.md with:
  - Security headers present/missing
  - CSP policy evaluated (violations found)
  - XSS vulnerability test results
  - Input validation checks
  - CSRF protection status
  - Cookie security status
  - Recommendations for improvement
"
```

**Expected Outputs:**
- `.orchestr8/docs/security/headers-audit.md` - Security headers validation
- CSP violations identified (if any)
- XSS vulnerability test results

---

### Phase 6: Browser DevTools Integration & Debugging (20%)

**⚡ EXECUTE TASK TOOL:**
```
Use the ui-debugger agent to:
1. Monitor console for errors and warnings
2. Detect network failures
3. Analyze JavaScript coverage
4. Debug detected issues
5. Suggest fixes for common problems

subagent_type: "orchestr8:quality:debugger"
description: "Debug issues using Chrome DevTools Protocol"
prompt: "Debug web application using DevTools: $*

Use Chrome DevTools Protocol to:

1. **Console Error Detection**
   - Monitor console.error messages
   - Capture JavaScript exceptions
   - Log page errors
   - Track console warnings
   - Identify source files/line numbers
   - Navigate through app to trigger errors

2. **Network Monitoring**
   - Track failed requests (4xx, 5xx)
   - Monitor request/response times
   - Check for 404 resources
   - Verify CORS errors
   - Detect slow API calls
   - Log redirects

3. **Code Coverage Analysis**
   - Enable JavaScript profiler
   - Enable CSS coverage
   - Calculate unused code percentage
   - Identify dead code
   - Suggest bundle optimizations
   - Recommend code splitting

4. **Issue Debugging**
   - For each detected issue:
     - Identify root cause
     - Locate source code
     - Suggest fix
     - Categorize severity
   - Create issue tracker file

5. **Auto-Fix Common Issues** (if --fix-issues flag)
   - Missing alt text: generate from filename
   - Missing ARIA labels: generate from context
   - Low contrast: suggest color adjustments
   - Update source files with fixes

Expected outputs:
- debugging-report.md with:
  - All console errors/warnings
  - Network failures
  - Code coverage statistics
  - Issues categorized by severity
  - Root cause analysis
  - Fix recommendations
- issues.json with structured issue data
- (if --fix-issues) List of auto-applied fixes
"
```

**Expected Outputs:**
- `debugging-report.md` - All detected issues
- `issues.json` - Structured issue data
- Auto-applied fixes (if --fix-issues flag)

**Quality Gate: Debugging**
```bash
# Validate debugging report
if [ ! -f "debugging-report.md" ]; then
  echo "❌ Debugging report not generated"
  exit 1
fi

# Check for console errors
ERRORS=$(grep -c "console.error\|JavaScript exception" debugging-report.md || echo "0")
if [ "$ERRORS" -gt 0 ]; then
  echo "⚠️  $ERRORS console errors detected"
fi

# Check for network failures
NETWORK_FAILS=$(grep -c "404\|500\|failed request" debugging-report.md || echo "0")
if [ "$NETWORK_FAILS" -gt 0 ]; then
  echo "⚠️  $NETWORK_FAILS network failures detected"
fi

echo "✅ Debugging complete, issues identified"
```

**Track Progress:** 90% complete

**CHECKPOINT**: Debugging complete, issues identified ✓

---

### Phase 7: Automated Test Generation with Component Library Guide (10%)

**⚡ EXECUTE TASK TOOL:**
```
Use the test-engineer agent to:
1. Generate Playwright/Cypress test suite
2. Create tests for all critical user flows
3. Include visual regression tests and design system validation
4. Add accessibility tests with WCAG 2.2 coverage
5. Generate component library recommendations based on findings

subagent_type: "orchestr8:quality:test-engineer"
description: "Generate automated test suite and component library guide"
prompt: "Generate automated test suite and component recommendations for application: $*

Based on all testing performed (visual, functional, accessibility, performance), generate:

1. **Test Suite Structure**
   - Create tests/ directory
   - Organize by test type:
     - tests/visual/ - Visual regression tests (design system validated)
     - tests/functional/ - User flow tests (keyboard accessible)
     - tests/accessibility/ - A11y tests (WCAG 2.2 AA coverage)
     - tests/performance/ - Performance tests (Core Web Vitals)
     - tests/security/ - Security tests (CSP, XSS, CSRF)
   - Add test configuration files
   - Create .test-baselines/ for visual regression

2. **Visual Regression Tests with Design System**
   - Generate screenshot comparison tests
   - Test all viewports (375x812, 768x1024, 1920x1080)
   - Include dark mode tests (data-theme=\"dark\")
   - Include typography validation (Inter font usage)
   - Include spacing grid validation (4px increments)
   - Include color contrast validation (OKLCH system)
   - Use baseline screenshots for regression detection

3. **Functional Tests with Keyboard Priority**
   - Generate tests for each user flow (keyboard-only navigation)
   - Include login/signup flows (< 100ms feedback)
   - Test form submissions with validation
   - Test navigation with keyboard shortcuts
   - Test interactive elements (modals, dropdowns, focus trap)
   - Test command palette if present (⌘+K / Ctrl+K)
   - Add proper assertions for state
   - Include error state testing

4. **Accessibility Tests (WCAG 2.2 AA)**
   - Generate axe-core integration tests (all pages)
   - Add keyboard navigation tests (logical tab order)
   - Include ARIA validation tests
   - Test color contrast (4.5:1 for text, 3:1 for components)
   - Test focus indicators (3:1 contrast minimum)
   - Test with screen reader simulation
   - Test touch target sizes (48px minimum)
   - Include live region tests for dynamic content

5. **Performance & Bundle Tests**
   - Generate Core Web Vitals assertions:
     - LCP < 2.5s, FCP < 1.8s, CLS < 0.1
   - Generate performance budget tests:
     - Initial bundle < 300KB
     - No interaction > 100ms visual feedback
   - Generate Lighthouse CI integration
   - Test asset optimization (images, fonts)
   - Monitor bundle size trends

6. **Security Tests**
   - Test CSP header compliance
   - Test XSS payload rejection
   - Test CSRF token validation
   - Test input sanitization
   - Test authentication required routes
   - Test no exposed secrets

7. **Component Library Recommendations**
   - Based on findings, generate COMPONENT-RECOMMENDATIONS.md with:

     **A. Component Library Stack**
     - Recommend Radix UI primitives (accessible foundations)
     - Recommend Tailwind CSS (semantic styling, design tokens)
     - Recommend shadcn/ui pattern (copy-paste components)
     - Recommend Lucide React for icons (consistent visual language)
     - Recommend react-hook-form + Zod (form validation)
     - Recommend Zustand (simple state management, if needed)

     **B. Design System Components Needed**
     - Command Palette (⌘+K interface for discoverability)
     - Primary Button (CTA, < 100ms feedback, blur test pass)
     - Secondary Button (alternative actions)
     - Form Input (auto-complete, validation feedback)
     - Modal/Dialog (focus trap, smooth animations)
     - Dropdown/Select (keyboard navigation, accessibility)
     - Tabs/Accordion (progressive disclosure, arrow keys)
     - Notification Toast (non-blocking, dismissible)
     - Navigation Menu (responsive, keyboard shortcuts)
     - Data Table (if applicable, with sorting/filtering)

     **C. Design Token Recommendations**
     - Color System: Use OKLCH (P3 gamut)
       - --color-bg-primary, --color-text-primary
       - --color-accent, --color-border
       - Dark mode variants (data-theme=\"dark\")
     - Typography:
       - --font-sans: Inter (UI text)
       - --font-mono: JetBrains Mono or Fira Code
       - --text-xs through --text-xl (mathematical scale)
     - Spacing: 4px grid system
       - --space-1 to --space-8 (0.25rem to 2rem)
     - Transitions:
       - --transition-fast: 150ms ease
       - --transition-medium: 250ms ease

     **D. Accessibility Checklist**
     - [ ] All components keyboard accessible
     - [ ] Focus indicators 3:1 contrast minimum
     - [ ] Color contrast 4.5:1 for text (normal)
     - [ ] Semantic HTML (nav, main, aside, footer)
     - [ ] ARIA labels on unlabeled elements
     - [ ] Live regions for dynamic updates
     - [ ] Touch targets 48px minimum
     - [ ] Screen reader tested

     **E. Performance Considerations**
     - [ ] Bundle size per component < 20KB
     - [ ] Tree-shaking enabled (ES modules)
     - [ ] No render-blocking resources
     - [ ] Animations use CSS (not JS)
     - [ ] Code splitting for heavy components
     - [ ] Images optimized (WebP/AVIF)

     **F. Best Practices Implemented**
     - Sub-100ms interaction feedback (Speed is a feature)
     - Task-oriented UI (structured inputs, smart defaults)
     - Dark mode support (theme toggle)
     - Responsive design (mobile-first)
     - Progressive enhancement (works without JS)
     - Internationalization ready (i18n structure)

8. **Test Configuration**
   - Create playwright.config.js or cypress.config.js:
     - Multi-browser testing (Chrome, Firefox, Safari)
     - Viewport configurations (mobile/tablet/desktop)
     - Screenshot baselines location (.test-baselines/)
     - Accessibility checks (axe-core integration)
     - Performance budget enforcement
   - Create .github/workflows/test.yml for CI
   - Configure test reporters (HTML, JSON, JUnit)
   - Add pre-commit hook for critical tests

9. **Test Documentation**
   - Create test-suite-readme.md with:
     - How to run tests locally
     - How to update visual baselines
     - CI/CD integration guide
     - Test coverage summary
     - Performance budget tracking
     - Accessibility compliance status
     - Component library adoption guide

Expected outputs:
- tests/ directory with complete test suite (80%+ coverage)
- playwright.config.js or cypress.config.js
- .github/workflows/test.yml (CI integration)
- package.json with test scripts
- test-suite-readme.md with comprehensive guide
- COMPONENT-RECOMMENDATIONS.md with:
  - Component library stack (Radix UI + Tailwind + shadcn/ui)
  - Design tokens and CSS variables
  - Accessibility checklist
  - Component inventory
  - Performance guidelines
"
```

**Expected Outputs:**
- `tests/` directory with automated test suite
- Test configuration files
- `test-suite-readme.md` - Test documentation

**Quality Gate: Test Generation**
```bash
# Validate test suite created
if [ ! -d "tests" ]; then
  echo "❌ Test suite not generated"
  exit 1
fi

# Check for test files
TEST_COUNT=$(find tests -name "*.spec.js" -o -name "*.spec.ts" | wc -l)
if [ "$TEST_COUNT" -lt 1 ]; then
  echo "❌ No test files generated"
  exit 1
fi

# Validate config exists
if [ ! -f "playwright.config.js" ] && [ ! -f "cypress.config.js" ]; then
  echo "⚠️  Test configuration file not found"
fi

echo "✅ Test suite generated ($TEST_COUNT test files)"
```

**Track Progress:** 100% complete

**CHECKPOINT**: Test suite generated ✓

---

## Success Criteria

Web UI testing complete when:
- ✅ Application running and accessible
- ✅ Visual design system compliance validated (typography, spacing, colors)
- ✅ Visual regression tests passing (< 0.5% difference)
- ✅ Responsive design works on mobile/tablet/desktop
- ✅ Keyboard navigation works (all actions doable via keyboard)
- ✅ All functional flows work correctly (< 100ms interaction feedback)
- ✅ Command palette functional (if present) with keyboard shortcuts documented
- ✅ WCAG 2.2 AA accessibility compliance achieved
- ✅ Color contrast minimum 4.5:1 for text, 3:1 for components
- ✅ Focus indicators visible (3:1 contrast minimum)
- ✅ Core Web Vitals meet targets (LCP < 2.5s, FCP < 1.8s, CLS < 0.1)
- ✅ Performance budget met (initial bundle < 300KB)
- ✅ Security headers configured (CSP, X-Frame-Options, etc.)
- ✅ No XSS vulnerabilities detected
- ✅ No console errors
- ✅ No broken links or failed requests
- ✅ Automated test suite generated (80%+ coverage)
- ✅ Component library recommendations provided
- ✅ All reports generated and documented
- ✅ Design system tokens documented (colors, typography, spacing)
- ✅ Accessibility checklist completed

---

## Example Usage

### Example 1: Test Production Application

```bash
/test-web-ui "https://myapp.com" --fix-issues --generate-tests
```

**Autonomous execution:**
1. visual-testing agent navigates to application
2. Takes screenshots and performs visual regression tests
3. Tests all user flows (login, signup, checkout, etc.)
4. accessibility-tester runs WCAG 2.1 AA audit
5. Identifies 15 issues (3 contrast, 5 missing alt text, 7 missing ARIA labels)
6. ui-debugger analyzes issues and suggests fixes
7. Auto-applies fixes for simple issues (alt text, ARIA labels)
8. Generates pull request with fixes
9. Creates comprehensive test suite (47 tests generated)

**Time: 15-30 minutes**

### Example 2: Test During Development

```bash
/test-web-ui "http://localhost:3000"
```

**Autonomous execution:**
1. Detects React dev server running
2. Performs smoke tests on all routes
3. Captures screenshots for visual review
4. Runs accessibility checks
5. Reports issues to console in real-time
6. Developer fixes issues
7. Re-runs tests automatically on file change

**Time: 5-10 minutes (continuous)**

---

## Reports Generated

**Discovery & Structure:**
- `application-structure.json` - Application discovery and routing

**Testing Reports:**
- `.orchestr8/docs/quality/visual-test-report.md` - Visual, design system, and layout testing
  - Visual regression results
  - Design system compliance (typography, spacing, colors)
  - Responsive design validation
  - Dark mode compatibility
- `.orchestr8/docs/quality/functional-test-report.md` - Functional and keyboard accessibility testing
  - User flow test results
  - Keyboard navigation validation
  - Command palette functionality
  - Interaction response times (< 100ms validation)
- `.orchestr8/docs/accessibility/audit.md` - WCAG 2.2 AA compliance audit
  - Compliance level achieved
  - Violations by severity with remediation steps
  - Keyboard navigation results
  - Color contrast report
  - Screen reader compatibility
  - Touch target size validation
- `.orchestr8/docs/performance/analysis.md` - Performance and bundle size analysis
  - Core Web Vitals results (vs targets)
  - Performance budget status (vs 300KB target)
  - Interaction response times (vs 100ms target)
  - Lighthouse scores (desktop + mobile)
  - Code coverage analysis
  - Bundle size breakdown
  - Optimization recommendations
- `.orchestr8/docs/security/headers-audit.md` - Security headers and CSP validation
  - Security headers present/missing
  - CSP policy evaluation
  - XSS vulnerability test results
  - Input validation checks
  - CSRF protection status

**Debugging & Analysis:**
- `debugging-report.md` - Console errors and network issues
- `issues.json` - Structured issue data

**Test Artifacts:**
- `tests/` - Complete automated test suite
  - `tests/visual/` - Visual regression tests
  - `tests/functional/` - User flow tests
  - `tests/accessibility/` - A11y tests
  - `tests/performance/` - Performance tests
  - `tests/security/` - Security tests
- `playwright.config.js` or `cypress.config.js` - Test configuration
- `.github/workflows/test.yml` - CI/CD integration
- `test-suite-readme.md` - Test documentation
- `COMPONENT-RECOMMENDATIONS.md` - Component library guide
  - Component library stack (Radix UI + Tailwind + shadcn/ui)
  - Design tokens (colors, typography, spacing)
  - Accessibility checklist
  - Component inventory
  - Performance guidelines

**Visual Assets:**
- `screenshots/` - All captured screenshots (light and dark modes)
- `.test-baselines/` - Visual regression baselines

---

**Autonomous, comprehensive web UI testing against world-class standards (Linear, GitHub, Vercel, VS Code) that validates design systems, performance budgets, accessibility compliance, security, and generates production-ready test suites with component library recommendations.**
