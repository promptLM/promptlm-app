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

package dev.promptlm.test.support;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Response;
import com.microsoft.playwright.options.AriaRole;
import com.microsoft.playwright.options.WaitForSelectorState;
import org.assertj.core.api.Assertions;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Encapsulates the UI steps for initial project setup so that the acceptance tests stay focused on
 * behavioural expectations instead of low-level Playwright calls.
 */
public final class ProjectSetupHelper {

    private ProjectSetupHelper() {
    }

    public static void verifyNoProjectExists(Path userHome) throws IOException {
        Path contextFile = userHome.resolve(".promptlm/context.json");
        Assertions.assertThat(contextFile).exists();
        Assertions.assertThat(Files.readString(contextFile)).isEqualToIgnoringWhitespace("""
                {
                    \"projects\":[],
                    \"activeProject\":null
                }
                """);
    }

    public static void createNewProject(Page page, String repositoryName, Path localBaseDir) {
        waitForSetupDialog(page);
        fillRepositoryName(page, repositoryName);
        fillLocalPath(page, localBaseDir);
        submitForm(page);
    }

    public static void assertRepositoryShownAsSelected(Page page, String repositoryName) {
        page.waitForSelector("text=" + repositoryName,
                new Page.WaitForSelectorOptions().setTimeout(10_000));
        Assertions.assertThat(page.isVisible("text=" + repositoryName)).isTrue();
    }

    private static void submitForm(Page page) {
        Response response = page.waitForResponse(
                candidate -> candidate.url().contains("/api/store")
                        && "POST".equalsIgnoreCase(candidate.request().method()),
                () -> page.getByTestId("submitProjectButton").click());

        String body = response.text();
        Assertions.assertThat(response.status())
                .as("Project creation request failed: %s".formatted(body))
                .isBetween(200, 299);

        page.waitForSelector(
                "text=Project Setup Required",
                new Page.WaitForSelectorOptions().setState(WaitForSelectorState.HIDDEN).setTimeout(30_000));
    }

    private static void fillLocalPath(Page page, Path localBaseDir) {
        page.getByTestId("newRepoPath").waitFor();
        page.getByTestId("newRepoPath").fill(localBaseDir.toString());
    }

    private static void fillRepositoryName(Page page, String repositoryName) {
        page.getByTestId("repositoryName").waitFor();
        page.getByTestId("repositoryName").fill(repositoryName);
    }

    private static void waitForSetupDialog(Page page) {
        Locator setupDialogTitle = page.getByText("Project Setup Required")
                .or(page.getByText("Select project"));
        setupDialogTitle.first().waitFor(
                new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE).setTimeout(10_000));

        // Ensure the "Create" tab is active so the form fields are visible.
        page.getByRole(AriaRole.TAB, new Page.GetByRoleOptions().setName("Create")).click();
        page.waitForSelector("text=Create new project");

        // Wait until the form inputs are actually present.
        page.getByTestId("repositoryName").waitFor();
        page.getByTestId("newRepoPath").waitFor();
    }
}
