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

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.PlaywrightException;
import com.microsoft.playwright.options.LoadState;
import com.microsoft.playwright.options.WaitForSelectorState;
import dev.promptlm.testutils.gitea.GiteaContainer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.junit.jupiter.api.Assertions.fail;

final class GiteaActionsUiHelper {

    private static final Logger log = LoggerFactory.getLogger(GiteaActionsUiHelper.class);

    private static final Duration DEFAULT_ACTION_TIMEOUT = Duration.ofMinutes(20);
    private static final Duration DEFAULT_DISCOVERY_TIMEOUT = Duration.ofMinutes(3);
    private static final Duration DISCOVERY_POLL_INTERVAL = Duration.ofSeconds(2);
    private static final Duration ACTION_STATUS_POLL_INTERVAL = Duration.ofSeconds(3);
    private static final Duration ACTION_PROGRESS_LOG_INTERVAL = Duration.ofSeconds(10);
    private static final Duration JOB_PAGE_READY_TIMEOUT = Duration.ofSeconds(20);
    private static final Pattern RUN_INDEX_PATTERN = Pattern.compile("/runs/(\\d+)");
    private static final Pattern JOB_INDEX_PATTERN = Pattern.compile("/jobs/(\\d+)");
    private static final String TERMINAL_STATUS_SELECTOR =
            ".job-info-header-detail:has-text(\"Success\"), " +
            ".job-info-header-detail:has-text(\"Failed\"), " +
            ".job-info-header-detail:has-text(\"Failure\"), " +
            ".job-info-header-detail:has-text(\"Error\"), " +
            ".job-info-header-detail:has-text(\"Cancelled\"), " +
            ".job-info-header .ui.label:has-text(\"Success\"), " +
            ".job-info-header .ui.label:has-text(\"Failed\"), " +
            ".job-info-header .ui.label:has-text(\"Failure\"), " +
            ".job-info-header .ui.label:has-text(\"Error\"), " +
            ".job-info-header .ui.label:has-text(\"Cancelled\")";
    private static final String STATUS_CANDIDATE_SELECTOR =
            ".job-info-header-detail, .job-info-header .ui.label";
    private static final Set<String> TERMINAL_STATUSES = Set.of("success", "failed", "failure", "error", "cancelled", "canceled");

    static void ensureSignedIn(Page page,
                                       GiteaContainer gitea) {
        String loginUrl = gitea.getWebUrl() + "/user/login";
        log.info("Navigating to Gitea login page: {}", loginUrl);
        page.navigate(loginUrl);
        Locator usernameInput = page.locator("#user_name");
        if (usernameInput.count() == 0) {
            // Already signed in.
            log.info("Already signed in to Gitea (login form not present)");
            return;
        }
        usernameInput.waitFor();
        usernameInput.fill(gitea.getAdminUsername());
        Locator passwordInput = page.locator("#password");
        passwordInput.waitFor();
        passwordInput.fill(gitea.getAdminPassword());
        page.locator("button:text('Sign In')").click();
        page.waitForLoadState(LoadState.DOMCONTENTLOADED);
        log.info("Signed in to Gitea as {}", gitea.getAdminUsername());
    }

    static void openLatestJobPage(Page page, GiteaContainer gitea, String repoOwner, String repoName) {
        openJobPageForWorkflow(page, gitea, repoOwner, repoName, null);
    }

    static void openJobPageForWorkflow(Page page,
                                       GiteaContainer gitea,
                                       String repoOwner,
                                       String repoName,
                                       String workflowFileName) {
        ensureSignedIn(page, gitea);

        String baseUrl = gitea.getWebUrl() + "/" + repoOwner + "/" + repoName;
        log.info("Opening Actions page for repo: {}/{} at {}", repoOwner, repoName, baseUrl + "/actions");
        page.navigate(baseUrl + "/actions", new Page.NavigateOptions().setTimeout(Duration.ofSeconds(30).toMillis()));
        boolean workflowFilterApplied = applyWorkflowFilter(page, workflowFileName);

        Duration discoveryTimeout = readDiscoveryTimeout();
        String runHref = waitForActionRunLinkHref(
                page,
                baseUrl + "/actions",
                workflowFileName,
                workflowFilterApplied,
                discoveryTimeout);

        log.info("Found Actions run link: {}", runHref);

        String runUrl = toAbsoluteUrl(gitea, runHref);
        log.info("Navigating to Actions run URL: {}", runUrl);
        page.navigate(runUrl, new Page.NavigateOptions().setTimeout(Duration.ofSeconds(30).toMillis()));

        String jobHref = waitForActionJobLinkHref(
                page,
                gitea,
                repoOwner,
                repoName,
                runUrl,
                workflowFileName,
                discoveryTimeout);

        log.info("Found Actions job link: {}", jobHref);

        String jobUrl = toAbsoluteUrl(gitea, jobHref);
        log.info("Navigating to Actions job URL: {}", jobUrl);
        page.navigate(jobUrl, new Page.NavigateOptions().setTimeout(Duration.ofSeconds(30).toMillis()));
        page.waitForLoadState(LoadState.DOMCONTENTLOADED);
    }

    public static void waitForSuccessfulAction(Page page) {
        Duration timeout = DEFAULT_ACTION_TIMEOUT;
        String configuredTimeoutMinutes = System.getProperty("promptlm.gitea.actions.timeout.minutes");
        if (configuredTimeoutMinutes != null && !configuredTimeoutMinutes.isBlank()) {
            try {
                timeout = Duration.ofMinutes(Long.parseLong(configuredTimeoutMinutes));
            } catch (NumberFormatException ignored) {
                timeout = DEFAULT_ACTION_TIMEOUT;
            }
        }

        log.info("Waiting up to {} minutes for workflow to reach terminal status. Current URL: {}",
                timeout.toMinutes(), page.url());

        long timeoutMillis = timeout.toMillis();
        long startMillis = System.currentTimeMillis();
        long deadlineMillis = startMillis + timeoutMillis;
        String initialJobUrl = page.url();
        long nextProgressLogAtMillis = startMillis;
        String lastObservedStatus = null;
        int reloadCounter = 0;
        int missingHeaderCounter = 0;

        while (System.currentTimeMillis() < deadlineMillis) {
            if (!ensureJobPageReady(page, initialJobUrl)) {
                missingHeaderCounter++;
                long nowMillis = System.currentTimeMillis();
                if (nowMillis >= nextProgressLogAtMillis) {
                    long elapsedSeconds = Math.max(0, (nowMillis - startMillis) / 1000);
                    long remainingSeconds = Math.max(0, (deadlineMillis - nowMillis) / 1000);
                    log.info("Workflow progress: status='{}', elapsed={}s, remaining={}s, url={}",
                            "ui-not-ready",
                            elapsedSeconds,
                            remainingSeconds,
                            page.url());
                    lastObservedStatus = "ui-not-ready";
                    nextProgressLogAtMillis = nowMillis + ACTION_PROGRESS_LOG_INTERVAL.toMillis();
                }

                if (missingHeaderCounter % 3 == 0) {
                    attemptNavigate(page, initialJobUrl);
                }
                page.waitForTimeout(ACTION_STATUS_POLL_INTERVAL.toMillis());
                continue;
            }

            missingHeaderCounter = 0;
            String terminalStatus = findTerminalStatus(page);
            if (terminalStatus != null) {
                log.info("Workflow finished with status: {}", terminalStatus);
                if ("success".equalsIgnoreCase(terminalStatus)) {
                    return;
                }
                fail("Workflow finished with status: " + terminalStatus + failureDiagnostics(page));
            }

            String observedStatus = readCurrentStatus(page);
            if (observedStatus == null || observedStatus.isBlank()) {
                observedStatus = "unknown";
            }

            long nowMillis = System.currentTimeMillis();
            if (!observedStatus.equals(lastObservedStatus) || nowMillis >= nextProgressLogAtMillis) {
                long elapsedSeconds = Math.max(0, (nowMillis - startMillis) / 1000);
                long remainingSeconds = Math.max(0, (deadlineMillis - nowMillis) / 1000);
                log.info("Workflow progress: status='{}', elapsed={}s, remaining={}s, url={}",
                        observedStatus,
                        elapsedSeconds,
                        remainingSeconds,
                        page.url());
                lastObservedStatus = observedStatus;
                nextProgressLogAtMillis = nowMillis + ACTION_PROGRESS_LOG_INTERVAL.toMillis();
            }

            page.waitForTimeout(ACTION_STATUS_POLL_INTERVAL.toMillis());

            // Reload periodically because this page is often not self-refreshing in CI setups.
            reloadCounter++;
            if (reloadCounter % 2 == 0) {
                attemptReload(page);
            }
        }

        String finalStatus = readCurrentStatus(page);
        fail("Timed out after " + timeout.toMinutes() + " minutes waiting for workflow completion. Last observed status: " +
                (finalStatus == null || finalStatus.isBlank() ? "unknown" : finalStatus) +
                failureDiagnostics(page));
    }

    private static boolean ensureJobPageReady(Page page, String expectedJobUrl) {
        if (isJobHeaderPresent(page)) {
            return true;
        }

        if (isLoginFormPresent(page)) {
            log.info("Detected login form while waiting for workflow completion; waiting for session recovery");
            return false;
        }

        attemptReload(page);
        waitForJobPageMarkers(page);

        if (isJobHeaderPresent(page)) {
            return true;
        }

        if (expectedJobUrl != null && !expectedJobUrl.isBlank() && !page.url().equals(expectedJobUrl)) {
            attemptNavigate(page, expectedJobUrl);
            waitForJobPageMarkers(page);
        }
        return isJobHeaderPresent(page);
    }

    private static void attemptReload(Page page) {
        try {
            page.reload(new Page.ReloadOptions().setTimeout(Duration.ofSeconds(30).toMillis()));
            page.waitForLoadState(LoadState.DOMCONTENTLOADED);
            waitForJobPageMarkers(page);
        } catch (PlaywrightException reloadException) {
            log.warn("Reload failed while waiting for workflow completion on {}: {}",
                    page.url(),
                    reloadException.getMessage());
        }
    }

    private static void attemptNavigate(Page page, String url) {
        try {
            page.navigate(url, new Page.NavigateOptions().setTimeout(Duration.ofSeconds(30).toMillis()));
            page.waitForLoadState(LoadState.DOMCONTENTLOADED);
        } catch (PlaywrightException navigateException) {
            log.warn("Navigate failed while waiting for workflow completion (url={}): {}",
                    url,
                    navigateException.getMessage());
        }
    }

    private static void waitForJobPageMarkers(Page page) {
        try {
            page.waitForFunction(
                    "() => !!document.querySelector('.job-info-header') || " +
                            "!!document.querySelector('.job-step-section') || " +
                            "!!document.querySelector('.job-info-header-detail') || " +
                            "!!document.querySelector('.ui.error.message')",
                    null,
                    new Page.WaitForFunctionOptions().setTimeout(JOB_PAGE_READY_TIMEOUT.toMillis()));
        } catch (PlaywrightException ignored) {
        }
    }

    private static boolean isJobHeaderPresent(Page page) {
        try {
            return page.locator(".job-info-header").count() > 0 || page.locator(".job-info-header-detail").count() > 0;
        } catch (PlaywrightException ignored) {
            return false;
        }
    }

    private static boolean isLoginFormPresent(Page page) {
        try {
            return page.locator("#user_name").count() > 0;
        } catch (PlaywrightException ignored) {
            return false;
        }
    }

    private static String findTerminalStatus(Page page) {
        try {
            Locator terminal = page.locator(TERMINAL_STATUS_SELECTOR);
            if (terminal.count() == 0) {
                String headerText = readJobHeaderText(page);
                return headerText.isBlank() ? null : terminalStatusFromHeader(headerText);
            }
            String text = terminal.first().textContent();
            if (text == null || text.isBlank()) {
                String headerText = readJobHeaderText(page);
                return headerText.isBlank() ? null : terminalStatusFromHeader(headerText);
            }
            String normalized = text.replaceAll("\\s+", " ").trim();
            String lower = normalized.toLowerCase(Locale.ROOT);
            for (String status : TERMINAL_STATUSES) {
                if (lower.contains(status)) {
                    return status;
                }
            }
            return normalized;
        } catch (PlaywrightException exception) {
            log.debug("Failed to read terminal status on page {}: {}", page.url(), exception.getMessage());
            String headerText = readJobHeaderText(page);
            return headerText.isBlank() ? null : terminalStatusFromHeader(headerText);
        }
    }

    private static String terminalStatusFromHeader(String headerText) {
        if (headerText == null || headerText.isBlank()) {
            return null;
        }
        for (String candidate : new String[] {"Success", "Failed", "Failure", "Error", "Cancelled", "Canceled"}) {
            if (containsWordIgnoreCase(headerText, candidate)) {
                return candidate.toLowerCase(Locale.ROOT);
            }
        }
        return null;
    }

    private static String readCurrentStatus(Page page) {
        try {
            Locator candidates = page.locator(STATUS_CANDIDATE_SELECTOR);
            int count = candidates.count();
            if (count == 0) {
                return statusFromHeaderFallback(page);
            }
            Set<String> statuses = new LinkedHashSet<>();
            List<String> words = List.of(
                    "Queued",
                    "Waiting",
                    "Running",
                    "Success",
                    "Failed",
                    "Failure",
                    "Error",
                    "Cancelled",
                    "Canceled");
            for (int i = 0; i < Math.min(count, 5); i++) {
                String text = candidates.nth(i).textContent();
                if (text == null || text.isBlank()) {
                    continue;
                }
                for (String candidate : words) {
                    if (containsWordIgnoreCase(text, candidate)) {
                        statuses.add(candidate);
                    }
                }
            }
            if (statuses.isEmpty()) {
                return statusFromHeaderFallback(page);
            }
            return String.join(" | ", statuses);
        } catch (PlaywrightException exception) {
            log.debug("Failed to read current status on page {}: {}", page.url(), exception.getMessage());
            return statusFromHeaderFallback(page);
        }
    }

    private static String statusFromHeaderFallback(Page page) {
        String headerText = readJobHeaderText(page);
        if (headerText.isBlank()) {
            return null;
        }

        Set<String> statuses = new LinkedHashSet<>();
        for (String candidate : new String[] {
                "Queued",
                "Waiting",
                "Running",
                "Success",
                "Failed",
                "Failure",
                "Error",
                "Cancelled",
                "Canceled"
        }) {
            if (containsWordIgnoreCase(headerText, candidate)) {
                statuses.add(candidate);
            }
        }
        if (statuses.isEmpty()) {
            return null;
        }
        return String.join(" | ", statuses);
    }

    private static String readJobHeaderText(Page page) {
        try {
            Locator header = page.locator(".job-info-header");
            if (header.count() == 0) {
                return "";
            }
            Locator first = header.first();
            String text = first.innerText();
            if (text != null && !text.isBlank()) {
                return text;
            }
            String content = first.textContent();
            if (content == null) {
                return "";
            }
            return content;
        } catch (PlaywrightException exception) {
            log.debug("Failed to read job header text on page {}: {}", page.url(), exception.getMessage());
            return "";
        }
    }

    private static boolean containsWordIgnoreCase(String haystack, String word) {
        if (haystack == null || haystack.isBlank() || word == null || word.isBlank()) {
            return false;
        }
        Pattern pattern = Pattern.compile("\\b" + Pattern.quote(word) + "\\b", Pattern.CASE_INSENSITIVE);
        return pattern.matcher(haystack).find();
    }

    private static String normalizeStatus(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.replace('\n', ' ').trim();
        if (normalized.isBlank()) {
            return null;
        }
        return Arrays.stream(normalized.split("\\s+"))
                .reduce((left, right) -> right)
                .orElse(normalized);
    }

    private static String toAbsoluteUrl(GiteaContainer gitea, String href) {
        if (href.startsWith("http://") || href.startsWith("https://")) {
            return href;
        }
        if (!href.startsWith("/")) {
            return gitea.getWebUrl() + "/" + href;
        }
        return gitea.getWebUrl() + href;
    }

    private static String waitForActionJobLinkHref(
            Page page,
            GiteaContainer gitea,
            String repoOwner,
            String repoName,
            String refreshUrl,
            String workflowFileName,
            Duration timeout) {

        long deadline = System.nanoTime() + timeout.toNanos();
        int attempt = 0;
        List<JobLinkCandidate> lastCandidates = List.of();

        while (System.nanoTime() < deadline) {
            attempt++;
            List<JobLinkCandidate> candidates = collectJobLinkCandidates(page);
            List<JobLinkCandidate> apiCandidates = collectJobLinkCandidatesFromApi(gitea, repoOwner, repoName, refreshUrl);
            if (!apiCandidates.isEmpty()) {
                Map<String, JobLinkCandidate> mergedCandidates = new LinkedHashMap<>();
                for (JobLinkCandidate candidate : candidates) {
                    mergedCandidates.put(candidate.href(), candidate);
                }
                for (JobLinkCandidate candidate : apiCandidates) {
                    mergedCandidates.putIfAbsent(candidate.href(), candidate);
                }
                candidates = new ArrayList<>(mergedCandidates.values());
            }
            if (!candidates.isEmpty()) {
                lastCandidates = candidates;
                JobLinkCandidate selected = selectPreferredJobLink(candidates, workflowFileName);
                if (selected != null && shouldDeferJobSelection(selected, candidates, workflowFileName)) {
                    selected = null;
                }
                if (selected != null) {
                    log.info("Selected Actions job candidate: href={}, index={}, text='{}'",
                            selected.href(),
                            selected.jobIndex(),
                            selected.description());
                    return selected.href();
                }
            }

            log.info("No usable job link yet (attempt {}), candidates={}, reloading {}",
                    attempt,
                    lastCandidates,
                    refreshUrl);
            page.waitForTimeout(DISCOVERY_POLL_INTERVAL.toMillis());
            try {
                page.reload(new Page.ReloadOptions().setTimeout(Duration.ofSeconds(30).toMillis()));
            } catch (PlaywrightException reloadException) {
                log.warn("Reload failed while waiting for job link, navigating directly to {}: {}",
                        refreshUrl,
                        reloadException.getMessage());
                page.navigate(refreshUrl, new Page.NavigateOptions().setTimeout(Duration.ofSeconds(30).toMillis()));
            }
        }

        throw new IllegalStateException(
                "Timed out after " + timeout.toSeconds() + "s waiting for actions job link on page " +
                        page.url() +
                        (lastCandidates.isEmpty() ? "" : ". Last job candidates: " + lastCandidates));
    }

    private static boolean shouldDeferJobSelection(JobLinkCandidate selected,
                                                  List<JobLinkCandidate> candidates,
                                                  String workflowFileName) {
        if (workflowFileName == null || workflowFileName.isBlank()) {
            return false;
        }
        String normalizedWorkflow = workflowFileName.toLowerCase(Locale.ROOT);
        if (!normalizedWorkflow.contains("deploy")) {
            return false;
        }

        boolean deployCandidatePresent = candidates.stream()
                .map(candidate -> candidate.description().toLowerCase(Locale.ROOT))
                .anyMatch(text -> text.contains("deploy"));

        if (deployCandidatePresent) {
            return false;
        }

        String selectedText = selected.description().toLowerCase(Locale.ROOT);
        if (selectedText.contains("failed") || selectedText.contains("failure") || selectedText.contains("error")) {
            return false;
        }

        return candidates.size() < 3;
    }

    private static JobLinkCandidate selectPreferredJobLink(List<JobLinkCandidate> candidates, String workflowFileName) {
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }

        String normalizedWorkflow = workflowFileName == null ? "" : workflowFileName.toLowerCase(Locale.ROOT);
        boolean deployWorkflow = normalizedWorkflow.contains("deploy");

        if (deployWorkflow) {
            for (JobLinkCandidate candidate : candidates) {
                String jobName = extractCandidateJobName(candidate).toLowerCase(Locale.ROOT);
                String text = candidate.description().toLowerCase(Locale.ROOT);
                if (text.contains("failed") || text.contains("failure") || text.contains("error")) {
                    return candidate;
                }
                if (jobName.contains("deploy") && !text.contains("blocked")) {
                    return candidate;
                }
            }
            return null;
        }

        for (JobLinkCandidate candidate : candidates) {
            String text = candidate.description().toLowerCase(Locale.ROOT);
            if (text.contains("failed") || text.contains("failure") || text.contains("error")) {
                return candidate;
            }
        }

        for (JobLinkCandidate candidate : candidates) {
            String text = candidate.description().toLowerCase(Locale.ROOT);
            if (text.contains("deploy") && !text.contains("blocked")) {
                return candidate;
            }
        }

        for (JobLinkCandidate candidate : candidates) {
            String text = candidate.description().toLowerCase(Locale.ROOT);
            if (text.contains("running")) {
                return candidate;
            }
        }

        if (deployWorkflow) {
            return candidates.stream()
                    .max((left, right) -> Integer.compare(left.jobIndex(), right.jobIndex()))
                    .orElse(candidates.get(0));
        }

        for (JobLinkCandidate candidate : candidates) {
            String text = candidate.description().toLowerCase(Locale.ROOT);
            if (!text.contains("blocked") && !text.contains("waiting")) {
                return candidate;
            }
        }

        return candidates.get(0);
    }

    private static String extractCandidateJobName(JobLinkCandidate candidate) {
        if (candidate == null) {
            return "";
        }
        String description = candidate.description();
        if (description == null || description.isBlank()) {
            return "";
        }
        String compact = description.replaceAll("\\s+", " ").trim();
        if (compact.isBlank()) {
            return "";
        }
        int space = compact.indexOf(' ');
        if (space <= 0) {
            return compact;
        }
        return compact.substring(0, space);
    }

    private static int parseJobIndex(String href) {
        if (href == null) {
            return -1;
        }
        Matcher matcher = JOB_INDEX_PATTERN.matcher(href);
        if (!matcher.find()) {
            return -1;
        }
        try {
            return Integer.parseInt(matcher.group(1));
        } catch (NumberFormatException ignored) {
            return -1;
        }
    }

    private static long parseRunIndex(String href) {
        if (href == null) {
            return -1;
        }
        Matcher matcher = RUN_INDEX_PATTERN.matcher(href);
        if (!matcher.find()) {
            return -1;
        }
        try {
            return Long.parseLong(matcher.group(1));
        } catch (NumberFormatException ignored) {
            return -1;
        }
    }

    private static String waitForActionRunLinkHref(
            Page page,
            String refreshUrl,
            String workflowFileName,
            boolean workflowFilterApplied,
            Duration timeout) {

        long deadline = System.nanoTime() + timeout.toNanos();
        int attempt = 0;
        String normalizedWorkflow = workflowFileName == null ? "" : workflowFileName.trim();
        List<String> lastCandidates = List.of();

        while (System.nanoTime() < deadline) {
            attempt++;
            List<RunLinkCandidate> runCandidates = collectRunLinkCandidates(page);

            String latestHref = null;
            List<String> candidateDescriptions = new ArrayList<>();

            for (RunLinkCandidate candidate : runCandidates) {
                String href = candidate.href();
                String rowText = candidate.description();
                if (latestHref == null) {
                    latestHref = href;
                }
                if (!rowText.isBlank()) {
                    candidateDescriptions.add(rowText);
                }
                if (normalizedWorkflow.isBlank() || workflowFilterApplied || matchesWorkflow(rowText, normalizedWorkflow)) {
                    return href;
                }
            }

            lastCandidates = candidateDescriptions;
            if (normalizedWorkflow.isBlank()) {
                log.info("No run link yet (attempt {}), reloading {}", attempt, refreshUrl);
            } else if (candidateDescriptions.isEmpty()) {
                log.info("No run link matching workflow '{}' yet (attempt {}), reloading {}",
                        normalizedWorkflow, attempt, refreshUrl);
            } else {
                log.info("No run link matching workflow '{}' yet (attempt {}), candidates={}, reloading {}",
                        normalizedWorkflow, attempt, candidateDescriptions, refreshUrl);
            }

            page.waitForTimeout(DISCOVERY_POLL_INTERVAL.toMillis());
            try {
                page.reload(new Page.ReloadOptions().setTimeout(Duration.ofSeconds(30).toMillis()));
            } catch (PlaywrightException reloadException) {
                log.warn("Reload failed while waiting for run link, navigating directly to {}: {}",
                        refreshUrl,
                        reloadException.getMessage());
                page.navigate(refreshUrl, new Page.NavigateOptions().setTimeout(Duration.ofSeconds(30).toMillis()));
            }

            if (normalizedWorkflow.isBlank() && latestHref != null) {
                return latestHref;
            }
        }

        throw new IllegalStateException(
                "Timed out after " + timeout.toSeconds() +
                        "s waiting for actions run link" +
                        (normalizedWorkflow.isBlank() ? "" : " matching workflow '" + normalizedWorkflow + "'") +
                        " on page " + page.url() +
                        (lastCandidates.isEmpty() ? "" : ". Last run candidates: " + lastCandidates));
    }

    private static String safeLocatorText(Locator locator) {
        try {
            return locator.innerText();
        } catch (PlaywrightException ignored) {
            return "";
        }
    }

    private static String safeRunCandidateText(Locator link) {
        List<String> snippets = new ArrayList<>();
        String linkText = safeLocatorText(link);
        if (!linkText.isBlank()) {
            snippets.add(linkText);
        }
        List<String> parentSelectors = List.of(
                "xpath=ancestor::li[1]",
                "xpath=ancestor::tr[1]",
                "xpath=ancestor::*[contains(@class,'item')][1]",
                "xpath=ancestor::*[contains(@class,'content')][1]",
                "xpath=ancestor::*[contains(@class,'row')][1]"
        );
        for (String parentSelector : parentSelectors) {
            try {
                Locator parent = link.locator(parentSelector);
                if (parent.count() == 0) {
                    continue;
                }
                String text = safeLocatorText(parent.first());
                if (!text.isBlank()) {
                    snippets.add(text);
                }
            } catch (PlaywrightException ignored) {
                // Keep best-effort matching resilient to varying Gitea DOM structures.
            }
        }
        return String.join(" ", snippets);
    }

    private static List<RunLinkCandidate> collectRunLinkCandidates(Page page) {
        Map<String, RunLinkCandidate> candidatesByHref = new LinkedHashMap<>();
        collectRunLinkCandidatesFromLocator(
                page.locator("a[href*='/actions/runs/']:not([href*='/jobs/'])"),
                candidatesByHref);
        collectRunLinkCandidatesFromLocator(
                page.locator("xpath=//a[contains(@href, '/actions/runs/') and not(contains(@href, '/jobs/'))]"),
                candidatesByHref);
        return new ArrayList<>(candidatesByHref.values());
    }

    private static void collectRunLinkCandidatesFromLocator(Locator links, Map<String, RunLinkCandidate> candidatesByHref) {
        try {
            int count = links.count();
            for (int i = 0; i < count; i++) {
                Locator link = links.nth(i);
                String href = link.getAttribute("href");
                if (href == null || href.isBlank() || candidatesByHref.containsKey(href)) {
                    continue;
                }
                String rowText = compactCandidateText(safeRunCandidateText(link));
                candidatesByHref.put(href, new RunLinkCandidate(href, rowText));
            }
        } catch (PlaywrightException ignored) {
            // Keep candidate collection best-effort for varying Gitea DOMs.
        }
    }

    private static List<JobLinkCandidate> collectJobLinkCandidates(Page page) {
        Map<String, JobLinkCandidate> candidatesByHref = new LinkedHashMap<>();
        collectJobLinkCandidatesFromLocator(
                page.locator("a[href*='/actions/runs/'][href*='/jobs/']"),
                candidatesByHref);
        collectJobLinkCandidatesFromLocator(
                page.locator("xpath=//a[contains(@href, '/actions/runs/') and contains(@href, '/jobs/')]"),
                candidatesByHref);
        return new ArrayList<>(candidatesByHref.values());
    }

    private static List<JobLinkCandidate> collectJobLinkCandidatesFromApi(
            GiteaContainer gitea,
            String repoOwner,
            String repoName,
            String runUrl) {

        long runId = parseRunIndex(runUrl);
        if (runId < 0) {
            return List.of();
        }

        try {
            List<JobLinkCandidate> candidates = new ArrayList<>();
            for (dev.promptlm.testutils.gitea.GiteaActions.ActionJobSummary job :
                    gitea.actions().listWorkflowJobs(repoOwner, repoName, runId)) {
                long jobId = job.id();
                String href = "/" + repoOwner + "/" + repoName + "/actions/runs/" + runId + "/jobs/" + jobId;
                String description = compactCandidateText(describeApiJob(job));
                candidates.add(new JobLinkCandidate(href, description, safeJobIndex(jobId)));
            }
            return candidates;
        } catch (RuntimeException apiError) {
            log.debug("Failed to collect Actions jobs via API for {}/{} run {}: {}",
                    repoOwner,
                    repoName,
                    runId,
                    apiError.getMessage());
            return List.of();
        }
    }

    private static void collectJobLinkCandidatesFromLocator(Locator links, Map<String, JobLinkCandidate> candidatesByHref) {
        try {
            int count = links.count();
            for (int i = 0; i < count; i++) {
                Locator link = links.nth(i);
                String href = link.getAttribute("href");
                if (href == null || href.isBlank() || candidatesByHref.containsKey(href)) {
                    continue;
                }
                String text = compactCandidateText(safeRunCandidateText(link));
                candidatesByHref.put(href, new JobLinkCandidate(href, text, parseJobIndex(href)));
            }
        } catch (PlaywrightException ignored) {
            // Keep candidate collection best-effort for varying Gitea DOMs.
        }
    }

    private static String compactCandidateText(String value) {
        if (value == null) {
            return "";
        }
        String compact = value.replaceAll("\\s+", " ").trim();
        if (compact.length() > 180) {
            return compact.substring(0, 180);
        }
        return compact;
    }

    private static String describeApiJob(dev.promptlm.testutils.gitea.GiteaActions.ActionJobSummary job) {
        List<String> parts = new ArrayList<>();
        if (job.name() != null && !job.name().isBlank()) {
            parts.add(job.name());
        }
        if (job.status() != null && !job.status().isBlank()) {
            parts.add(job.status());
        }
        if (job.conclusion() != null && !job.conclusion().isBlank()) {
            parts.add(job.conclusion());
        }
        if (job.runnerName() != null && !job.runnerName().isBlank()) {
            parts.add(job.runnerName());
        }
        return String.join(" ", parts);
    }

    private static int safeJobIndex(long jobId) {
        if (jobId > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }
        if (jobId < Integer.MIN_VALUE) {
            return Integer.MIN_VALUE;
        }
        return (int) jobId;
    }

    private static boolean matchesWorkflow(String candidateText, String workflowFileName) {
        if (workflowFileName == null || workflowFileName.isBlank()) {
            return true;
        }
        if (candidateText == null || candidateText.isBlank()) {
            return false;
        }
        String normalizedCandidate = candidateText.toLowerCase(Locale.ROOT);
        String normalizedWorkflow = workflowFileName.toLowerCase(Locale.ROOT);
        if (normalizedCandidate.contains(normalizedWorkflow)) {
            return true;
        }
        String baseName = normalizedWorkflow
                .replaceAll("\\.ya?ml$", "")
                .trim();
        if (!baseName.isBlank() && normalizedCandidate.contains(baseName)) {
            return true;
        }
        String[] tokens = baseName.split("[-_./]+");
        int matchedTokens = 0;
        for (String token : tokens) {
            if (token.isBlank()) {
                continue;
            }
            if (normalizedCandidate.contains(token)) {
                matchedTokens++;
            }
        }
        return matchedTokens >= Math.min(2, tokens.length);
    }

    private static boolean applyWorkflowFilter(Page page, String workflowFileName) {
        if (workflowFileName == null || workflowFileName.isBlank()) {
            return false;
        }
        Locator exactFilterLink = page.locator("a:has-text('" + workflowFileName + "'), .item:has-text('" + workflowFileName + "')");
        if (exactFilterLink.count() == 0) {
            log.info("Workflow filter '{}' not present in Actions sidebar; continuing without pre-filter", workflowFileName);
            return false;
        }
        try {
            log.info("Applying Actions workflow filter '{}'", workflowFileName);
            exactFilterLink.first().click();
            page.waitForLoadState(LoadState.DOMCONTENTLOADED);
            return true;
        } catch (PlaywrightException exception) {
            log.warn("Failed to apply workflow filter '{}': {}", workflowFileName, exception.getMessage());
            return false;
        }
    }

    private static boolean containsIgnoreCase(String text, String needle) {
        return text.toLowerCase(Locale.ROOT).contains(needle.toLowerCase(Locale.ROOT));
    }

    private static String failureDiagnostics(Page page) {
        String artifactHint = captureFailureArtifacts(page);
        try {
            String bodyText = page.locator("body").innerText();
            if (bodyText == null || bodyText.isBlank()) {
                return artifactHint;
            }
            List<String> snippets = extractFailureSnippets(bodyText);
            if (snippets.isEmpty()) {
                String compact = bodyText.replaceAll("\\s+", " ").trim();
                if (compact.length() > 300) {
                    compact = compact.substring(0, 300);
                }
                return (artifactHint + (compact.isBlank() ? "" : " | context: " + compact)).trim();
            }
            return (artifactHint + " | details: " + String.join(" | ", snippets)).trim();
        } catch (PlaywrightException exception) {
            return (artifactHint + " | details unavailable (" + exception.getMessage() + ")").trim();
        }
    }

    private static String captureFailureArtifacts(Page page) {
        try {
            Path targetDir = Path.of(System.getProperty("java.io.tmpdir"), "promptlm-gitea-actions");
            Files.createDirectories(targetDir);
            String baseName = "failure-" + Instant.now().toEpochMilli();

            Path stepLogsPath = targetDir.resolve(baseName + "-steps.txt");
            try {
                String stepLogs = collectFailureStepLogs(page);
                if (stepLogs != null && !stepLogs.isBlank()) {
                    Files.writeString(stepLogsPath, stepLogs);
                }
            } catch (Exception logError) {
                log.warn("Failed to capture step logs at {}: {}", stepLogsPath, logError.getMessage());
            }

            Path screenshotPath = targetDir.resolve(baseName + ".png");
            try {
                page.screenshot(new Page.ScreenshotOptions().setPath(screenshotPath).setFullPage(true));
            } catch (PlaywrightException screenshotError) {
                log.warn("Failed to capture Playwright screenshot at {}: {}", screenshotPath, screenshotError.getMessage());
            }

            Path pageTextPath = targetDir.resolve(baseName + ".txt");
            try {
                String bodyText = page.locator("body").innerText();
                if (bodyText != null && !bodyText.isBlank()) {
                    Files.writeString(pageTextPath, bodyText);
                }
            } catch (PlaywrightException textError) {
                log.warn("Failed to capture Playwright page text at {}: {}", pageTextPath, textError.getMessage());
            }

            Path pageHtmlPath = targetDir.resolve(baseName + ".html");
            try {
                String html = page.content();
                if (html != null && !html.isBlank()) {
                    Files.writeString(pageHtmlPath, html);
                }
            } catch (PlaywrightException htmlError) {
                log.warn("Failed to capture Playwright page HTML at {}: {}", pageHtmlPath, htmlError.getMessage());
            }

            return " | artifacts: " + screenshotPath.toAbsolutePath() + ", " + pageTextPath.toAbsolutePath() + ", " + pageHtmlPath.toAbsolutePath() + ", " + stepLogsPath.toAbsolutePath();
        } catch (IOException ioError) {
            log.warn("Failed to create diagnostics output directory", ioError);
            return "";
        } catch (RuntimeException unexpected) {
            log.warn("Failed to capture failure artifacts", unexpected);
            return "";
        }
    }

    private static String collectFailureStepLogs(Page page) {
        try {
            Locator failureSteps = page.locator(".job-step-summary:has([aria-label='failure']), .job-step-summary:has([data-tooltip-content='failure'])");
            int count = failureSteps.count();
            if (count == 0) {
                return "";
            }

            StringBuilder builder = new StringBuilder();
            builder.append("URL: ").append(page.url()).append('\n');

            int max = Math.min(count, 3);
            for (int i = 0; i < max; i++) {
                Locator summary = failureSteps.nth(i);
                String name = "(unknown step)";
                try {
                    Locator nameLoc = summary.locator(".step-summary-msg");
                    if (nameLoc.count() > 0) {
                        String text = nameLoc.first().textContent();
                        if (text != null && !text.isBlank()) {
                            name = text.replaceAll("\\s+", " ").trim();
                        }
                    }
                } catch (PlaywrightException ignored) {
                }

                builder.append("\n=== ").append(name).append(" ===\n");

                Locator section = summary.locator("xpath=ancestor::*[contains(@class,'job-step-section')][1]");
                if (section.count() == 0) {
                    continue;
                }

                try {
                    summary.click(new Locator.ClickOptions().setTimeout(Duration.ofSeconds(5).toMillis()));
                } catch (PlaywrightException ignored) {
                }

                Locator logs = section.first().locator(".job-step-logs");
                try {
                    logs.waitFor(new Locator.WaitForOptions()
                            .setState(WaitForSelectorState.VISIBLE)
                            .setTimeout(Duration.ofSeconds(15).toMillis()));
                } catch (PlaywrightException ignored) {
                }

                String logText = "";
                try {
                    logText = logs.innerText();
                } catch (PlaywrightException ignored) {
                    logText = "";
                }

                logText = logText == null ? "" : logText.trim();
                if (logText.isBlank()) {
                    builder.append("(no step logs extracted)\n");
                    continue;
                }

                if (logText.length() > 12000) {
                    logText = logText.substring(logText.length() - 12000);
                }
                builder.append(logText).append('\n');
            }

            return builder.toString();
        } catch (PlaywrightException exception) {
            log.debug("Failed to collect failure step logs: {}", exception.getMessage());
            return "";
        }
    }

    private static List<String> extractFailureSnippets(String bodyText) {
        String[] keywords = {
                "set up job",
                "error",
                "failed",
                "failure",
                "not found",
                "checksum",
                "exit code"
        };
        Set<String> matches = new LinkedHashSet<>();
        for (String line : bodyText.split("\\R")) {
            String normalized = line == null ? "" : line.replaceAll("\\s+", " ").trim();
            if (normalized.isBlank()) {
                continue;
            }
            for (String keyword : keywords) {
                if (containsIgnoreCase(normalized, keyword)) {
                    matches.add(normalized.length() > 220 ? normalized.substring(0, 220) : normalized);
                    break;
                }
            }
            if (matches.size() >= 6) {
                break;
            }
        }
        return new ArrayList<>(matches);
    }

    private static Duration readDiscoveryTimeout() {
        String configuredSeconds = System.getProperty("promptlm.gitea.actions.discovery.timeout.seconds");
        if (configuredSeconds == null || configuredSeconds.isBlank()) {
            return DEFAULT_DISCOVERY_TIMEOUT;
        }
        try {
            long timeoutSeconds = Long.parseLong(configuredSeconds);
            if (timeoutSeconds <= 0) {
                return DEFAULT_DISCOVERY_TIMEOUT;
            }
            return Duration.ofSeconds(timeoutSeconds);
        } catch (NumberFormatException ignored) {
            return DEFAULT_DISCOVERY_TIMEOUT;
        }
    }

    private record RunLinkCandidate(String href, String description) {
    }

    private record JobLinkCandidate(String href, String description, int jobIndex) {
        @Override
        public String toString() {
            return "{href=" + href + ", index=" + jobIndex + ", text='" + description + "'}";
        }
    }
}
