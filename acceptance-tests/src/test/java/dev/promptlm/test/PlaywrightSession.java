/*
 * Copyright 2025 promptLM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package dev.promptlm.test;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.LoadState;
import org.junit.jupiter.api.Assumptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

public class PlaywrightSession {

    private static final Logger log = LoggerFactory.getLogger(PlaywrightSession.class);
    private static final double DEFAULT_TIMEOUT_MS = Double.parseDouble(
            System.getProperty("playwright.timeout.ms",
                    System.getenv().getOrDefault("PLAYWRIGHT_TIMEOUT_MS", "900000")));
    private Playwright playwright;
    private Browser browser;
    private final String baseUrl;
    protected BrowserContext context;
    protected Page page;

    private PlaywrightSession(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public static PlaywrightSession startPlaywrightSession(String baseUrl) {
        PlaywrightSession session = new PlaywrightSession(baseUrl);
        session.initPlaywright();
        session.createContextAndPage();
        return session;
    }

    /**
     * Initialize Playwright and browser
     */
    private void initPlaywright() {
        try {
            playwright = Playwright.create();
            boolean headless = Boolean.parseBoolean(System.getProperty(
                    "playwright.headless",
                    System.getenv().getOrDefault("PLAYWRIGHT_HEADLESS", "true")));
            long slowMoMillis = Long.parseLong(System.getProperty(
                    "playwright.slowmo",
                    System.getenv().getOrDefault("PLAYWRIGHT_SLOWMO", "0")));
            log.info("Launching Playwright (headless={}, slowMo={}ms, timeout={}ms)", headless, slowMoMillis, DEFAULT_TIMEOUT_MS);
            BrowserType.LaunchOptions launch = new BrowserType.LaunchOptions()
                    .setHeadless(headless)
                    .setChannel("chrome")
                    .setTimeout(DEFAULT_TIMEOUT_MS)
                    .setDevtools(false)
                    .setEnv(Map.of("PLAYWRIGHT_KEEP_BROWSER_OPEN", "true"))
                    // a few crash-mitigating flags if needed:
                    .setArgs(List.of(
                            "--disable-gpu",           // helps on some macOS setups
                            "--use-mock-keychain",     // avoids keychain prompts
                            "--single-process"         // helps with cleanup
                    ));

            if (!headless || slowMoMillis > 0) {
                launch.setSlowMo(Math.max(slowMoMillis, 1200));
            }

            browser = playwright.chromium().launch(launch);
            log.info("Playwright browser launched");
        } catch (Exception e) {
            log.warn("⚠️  Playwright not available or browser not installed: {}", e.getMessage());
            Assumptions.assumeTrue(false, "Skipping tests: Playwright not available");
        }
    }

    void createContextAndPage() {
        try {
            // Make sure we have a valid browser instance
            if (browser == null || playwright == null) {
                throw new IllegalStateException("Browser or Playwright not found");
            }

            // Create a new context and page for each test
            context = browser.newContext(new Browser.NewContextOptions()
                    .setViewportSize(1280, 720));
            context.tracing().start(new Tracing.StartOptions()
                    .setScreenshots(true)
                    .setSnapshots(true)
                    .setSources(true));
            page = context.newPage();
            page.setDefaultTimeout(DEFAULT_TIMEOUT_MS);

            log.debug("Created new browser context and page");
        } catch (Exception e) {
            throw new RuntimeException("Failed to create browser context and page", e);
        }
    }

    public void endSession() {
        if (page != null) {
            try {
                page.close();
            } catch (Exception e) {
                log.error("Error closing page: " + e.getMessage());
            }
            page = null;
        }

        if (context != null) {
            try {
                context.close();
            } catch (Exception e) {
                log.error("Error closing context: " + e.getMessage());
            }
            context = null;
        }
    }

    public void shutdown() {
        try {
            endSession();

            // Close browser
            if (browser != null) {
                try {
                    browser.close();
                } catch (Exception e) {
                    log.error("Error closing browser: {}", e.getMessage());
                }
                browser = null;
            }

            if (playwright != null) {
                try {
                    playwright.close();
                } catch (Exception e) {
                    log.error("Error closing Playwright: {}", e.getMessage());
                }
                playwright = null;
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to shutdown Playwright and browser", e);
        }
    }

    /**
     * Navigate to the application URL
     */
    protected void navigateToApp() {
        log.info("Navigating to app at {}", baseUrl);
        page.navigate(baseUrl);
        // Wait for the application to be loaded
        page.waitForLoadState(LoadState.DOMCONTENTLOADED);
    }

    /**
     * Navigate to a specific path within the application
     */
    @Deprecated
    protected void navigateToPath(String path) {
        page.navigate(baseUrl + path);
        page.waitForLoadState(LoadState.DOMCONTENTLOADED);
    }

    public Page getPage() {
        return page;
    }
}
