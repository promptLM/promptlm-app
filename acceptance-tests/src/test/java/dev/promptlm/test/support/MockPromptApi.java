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

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import com.microsoft.playwright.Request;
import com.microsoft.playwright.Route;
import dev.promptlm.domain.ObjectMapperFactory;

import java.net.URI;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

public final class MockPromptApi {
    private final ObjectMapper mapper = ObjectMapperFactory.createJsonMapper();
    private final Map<String, ObjectNode> prompts = new ConcurrentHashMap<>();
    private final Map<String, ObjectNode> projects = new ConcurrentHashMap<>();
    private final Map<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final AtomicInteger promptSequence = new AtomicInteger(10);
    private final AtomicInteger projectSequence = new AtomicInteger(5);
    private volatile String activeProjectId;

    public static MockPromptApi seeded() {
        MockPromptApi api = new MockPromptApi();
        api.seedProjects();
        api.seedPrompts();
        return api;
    }

    public int getRequestCount(String method, String path) {
        return requestCounts.getOrDefault(method + " " + path, new AtomicInteger(0)).get();
    }

    public String getActivePromptId() {
        return prompts.keySet().stream().findFirst().orElse(null);
    }

    public void handle(Route route) {
        Request request = route.request();
        URI uri = URI.create(request.url());
        String path = uri.getPath();
        String method = request.method().toUpperCase(Locale.ROOT);

        recordRequest(method, path);

        try {
            if (path.startsWith("/api/prompts")) {
                handlePromptRequest(route, method, path, request.postData());
                return;
            }
            if (path.startsWith("/api/store")) {
                handleStoreRequest(route, method, path, request.postData());
                return;
            }
            route.fulfill(new Route.FulfillOptions().setStatus(404));
        } catch (PromptNotFoundException error) {
            route.fulfill(new Route.FulfillOptions().setStatus(404));
        } catch (Exception error) {
            ObjectNode payload = mapper.createObjectNode();
            payload.put("message", "Mock API error: " + error.getMessage());
            fulfillJson(route, 500, payload);
        }
    }

    private void recordRequest(String method, String path) {
        requestCounts.computeIfAbsent(method + " " + path, key -> new AtomicInteger(0)).incrementAndGet();
    }

    private void handlePromptRequest(Route route, String method, String path, String body) throws Exception {
        List<String> segments = segments(path);
        if (segments.size() == 2) {
            if ("GET".equals(method)) {
                ArrayNode list = mapper.createArrayNode();
                prompts.values().stream()
                        .sorted((left, right) -> right.path("updatedAt").asText().compareTo(left.path("updatedAt").asText()))
                        .forEach(list::add);
                fulfillJson(route, 200, list);
                return;
            }
            if ("POST".equals(method)) {
                ObjectNode created = createPromptFromBody(body);
                prompts.put(created.path("id").asText(), created);
                fulfillJson(route, 200, created);
                return;
            }
        }

        if (segments.size() == 3 && "stats".equals(segments.get(2)) && "GET".equals(method)) {
            fulfillJson(route, 200, buildPromptStats());
            return;
        }

        if (segments.size() == 3 && "execute".equals(segments.get(2)) && "POST".equals(method)) {
            ObjectNode executed = executePrompt(body, null);
            fulfillJson(route, 200, executed);
            return;
        }

        if (segments.size() == 3) {
            String promptId = segments.get(2);
            if ("GET".equals(method)) {
                ObjectNode prompt = prompts.get(promptId);
                if (prompt == null) {
                    route.fulfill(new Route.FulfillOptions().setStatus(404));
                    return;
                }
                fulfillJson(route, 200, prompt);
                return;
            }
            if ("PUT".equals(method)) {
                ObjectNode updated = updatePrompt(promptId, body);
                fulfillJson(route, 200, updated);
                return;
            }
        }

        if (segments.size() == 4) {
            String promptId = segments.get(2);
            String action = segments.get(3);
            if ("release".equals(action) && "POST".equals(method)) {
                ObjectNode released = releasePrompt(promptId);
                fulfillJson(route, 200, released);
                return;
            }
            if ("execute".equals(action) && "POST".equals(method)) {
                ObjectNode executed = executePrompt(body, promptId);
                fulfillJson(route, 200, executed);
                return;
            }
        }

        route.fulfill(new Route.FulfillOptions().setStatus(404));
    }

    private void handleStoreRequest(Route route, String method, String path, String body) throws Exception {
        List<String> segments = segments(path);
        if (segments.size() == 2) {
            if ("GET".equals(method)) {
                ObjectNode active = activeProjectId != null ? projects.get(activeProjectId) : null;
                if (active == null) {
                    route.fulfill(new Route.FulfillOptions().setStatus(404));
                    return;
                }
                fulfillJson(route, 200, active);
                return;
            }
            if ("POST".equals(method)) {
                ObjectNode created = createProjectFromBody(body, "created");
                projects.put(created.path("id").asText(), created);
                activeProjectId = created.path("id").asText();
                fulfillJson(route, 200, created);
                return;
            }
            if ("PUT".equals(method)) {
                ObjectNode created = createProjectFromBody(body, "cloned");
                projects.put(created.path("id").asText(), created);
                activeProjectId = created.path("id").asText();
                fulfillJson(route, 200, mapper.getNodeFactory().textNode(created.path("id").asText()));
                return;
            }
        }

        if (segments.size() == 3 && "all".equals(segments.get(2)) && "GET".equals(method)) {
            ArrayNode list = mapper.createArrayNode();
            projects.values().forEach(list::add);
            fulfillJson(route, 200, list);
            return;
        }

        if (segments.size() == 3 && "connection".equals(segments.get(2)) && "POST".equals(method)) {
            ObjectNode created = createProjectFromBody(body, "connected");
            projects.put(created.path("id").asText(), created);
            activeProjectId = created.path("id").asText();
            fulfillJson(route, 200, created);
            return;
        }

        if (segments.size() == 4 && "switch".equals(segments.get(2)) && "POST".equals(method)) {
            String projectId = segments.get(3);
            if (projects.containsKey(projectId)) {
                activeProjectId = projectId;
                route.fulfill(new Route.FulfillOptions().setStatus(200));
            } else {
                route.fulfill(new Route.FulfillOptions().setStatus(404));
            }
            return;
        }

        if (segments.size() == 3 && "owners".equals(segments.get(2)) && "GET".equals(method)) {
            ArrayNode owners = mapper.createArrayNode();
            owners.add(mapper.createObjectNode()
                    .put("id", "owner-1")
                    .put("displayName", "PromptLM")
                    .put("type", "ORGANIZATION"));
            fulfillJson(route, 200, owners);
            return;
        }

        route.fulfill(new Route.FulfillOptions().setStatus(404));
    }

    private ObjectNode buildPromptStats() {
        ObjectNode stats = mapper.createObjectNode();
        stats.put("totalPrompts", prompts.size());
        stats.put("activePrompts", prompts.values().stream()
                .filter(prompt -> "ACTIVE".equalsIgnoreCase(prompt.path("status").asText()))
                .count());
        stats.put("retiredPrompts", prompts.values().stream()
                .filter(prompt -> "RETIRED".equalsIgnoreCase(prompt.path("status").asText()))
                .count());
        stats.put("activeProjects", projects.size());
        stats.put("lastUpdated", Instant.now().toString());
        stats.set("countByGroup", mapper.createObjectNode());
        return stats;
    }

    private ObjectNode createPromptFromBody(String body) throws Exception {
        JsonNode payload = mapper.readTree(body == null ? "{}" : body);
        String name = textOr(payload, "name", "new-prompt");
        String group = textOr(payload, "group", name);
        String description = textOr(payload, "description", "");
        ObjectNode request = payload.has("request") && payload.get("request").isObject()
                ? (ObjectNode) payload.get("request")
                : mapper.createObjectNode();

        String id = payload.hasNonNull("id") ? payload.get("id").asText() : "prompt-" + promptSequence.incrementAndGet();
        ObjectNode prompt = basePrompt(id, name, group, description, request);
        prompt.put("status", "DRAFT");
        prompt.put("version", "0.1.0");
        prompt.put("revision", 1);
        return prompt;
    }

    private ObjectNode updatePrompt(String promptId, String body) throws Exception {
        ObjectNode existing = prompts.get(promptId);
        if (existing == null) {
            throw new PromptNotFoundException(promptId);
        }
        JsonNode payload = mapper.readTree(body == null ? "{}" : body);
        if (payload.hasNonNull("name")) {
            existing.put("name", payload.get("name").asText());
        }
        if (payload.hasNonNull("description")) {
            existing.put("description", payload.get("description").asText());
        }
        if (payload.has("request") && payload.get("request").isObject()) {
            existing.set("request", payload.get("request"));
        }
        existing.put("revision", existing.path("revision").asInt(0) + 1);
        existing.put("updatedAt", Instant.now().toString());
        return existing;
    }

    private ObjectNode executePrompt(String body, String promptId) throws Exception {
        JsonNode payload = mapper.readTree(body == null ? "{}" : body);
        ObjectNode promptSpec = payload.has("promptSpec") && payload.get("promptSpec").isObject()
                ? (ObjectNode) payload.get("promptSpec")
                : mapper.createObjectNode();
        String resolvedId = promptId != null ? promptId : textOr(promptSpec, "id", "temp-" + promptSequence.incrementAndGet());
        String name = textOr(promptSpec, "name", "prompt-" + resolvedId);

        ObjectNode response = mapper.createObjectNode();
        response.put("type", "chat/completion");
        response.put("content", "Mock response for " + name);

        ObjectNode executed = basePrompt(resolvedId, name, textOr(promptSpec, "group", "default"),
                textOr(promptSpec, "description", ""),
                promptSpec.has("request") && promptSpec.get("request").isObject()
                        ? (ObjectNode) promptSpec.get("request")
                        : mapper.createObjectNode());
        executed.set("response", response);

        if (promptId != null && prompts.containsKey(promptId)) {
            ObjectNode stored = prompts.get(promptId);
            stored.set("response", response);
            stored.put("updatedAt", Instant.now().toString());
        }
        return executed;
    }

    private ObjectNode releasePrompt(String promptId) {
        ObjectNode prompt = prompts.get(promptId);
        if (prompt == null) {
            throw new PromptNotFoundException(promptId);
        }
        String currentVersion = prompt.path("version").asText("0.1.0");
        prompt.put("version", bumpVersion(currentVersion));
        prompt.put("status", "ACTIVE");
        prompt.put("updatedAt", Instant.now().toString());
        return prompt;
    }

    private ObjectNode createProjectFromBody(String body, String mode) throws Exception {
        JsonNode payload = mapper.readTree(body == null ? "{}" : body);
        String name = textOr(payload, "repoName", textOr(payload, "displayName", "project-" + projectSequence.incrementAndGet()));
        String repoDir = textOr(payload, "repoDir", textOr(payload, "repoPath", "/tmp/project"));
        String repoUrl = textOr(payload, "remoteUrl", "https://example.com/" + name);
        String description = textOr(payload, "description", mode + " project");

        ObjectNode project = mapper.createObjectNode();
        String id = UUID.randomUUID().toString();
        project.put("id", id);
        project.put("name", name);
        project.put("description", description);
        project.put("promptCount", prompts.size());
        project.put("createdAt", Instant.now().toString());
        project.put("updatedAt", Instant.now().toString());
        project.put("localPath", repoDir);
        project.put("repositoryUrl", repoUrl);
        project.put("healthStatus", "HEALTHY");
        return project;
    }

    private ObjectNode basePrompt(String id, String name, String group, String description, ObjectNode request) {
        ObjectNode prompt = mapper.createObjectNode();
        prompt.put("id", id);
        prompt.put("name", name);
        prompt.put("group", group);
        prompt.put("description", description);
        prompt.put("status", "ACTIVE");
        prompt.put("version", "1.0.0");
        prompt.put("revision", 1);
        prompt.put("projectId", activeProjectId == null ? "default" : activeProjectId);
        prompt.put("updatedAt", Instant.now().toString());
        prompt.put("createdAt", Instant.now().toString());

        ObjectNode resolvedRequest = request.deepCopy();
        if (!resolvedRequest.hasNonNull("type")) {
            resolvedRequest.put("type", "chat/completion");
        }
        if (!resolvedRequest.hasNonNull("vendor")) {
            resolvedRequest.put("vendor", "openai");
        }
        if (!resolvedRequest.hasNonNull("model")) {
            resolvedRequest.put("model", "gpt-4o");
        }
        if (!resolvedRequest.has("parameters")) {
            resolvedRequest.set("parameters", mapper.createObjectNode()
                    .put("temperature", 0.7)
                    .put("maxTokens", 256)
                    .put("topP", 1));
        }
        if (!resolvedRequest.has("messages")) {
            ArrayNode messages = mapper.createArrayNode();
            messages.add(mapper.createObjectNode()
                    .put("role", "system")
                    .put("content", "You are a helpful assistant."));
            messages.add(mapper.createObjectNode()
                    .put("role", "user")
                    .put("content", "Provide a summary."));
            resolvedRequest.set("messages", messages);
        }
        prompt.set("request", resolvedRequest);

        ObjectNode placeholders = mapper.createObjectNode();
        placeholders.put("startPattern", "{{");
        placeholders.put("endPattern", "}}");
        ArrayNode list = mapper.createArrayNode();
        list.add(mapper.createObjectNode().put("name", "user_name").put("value", "Ada"));
        placeholders.set("list", list);
        prompt.set("placeholders", placeholders);

        return prompt;
    }

    private void seedProjects() {
        ObjectNode alpha = mapper.createObjectNode();
        alpha.put("id", "project-alpha");
        alpha.put("name", "Alpha Workspace");
        alpha.put("description", "Primary prompt workspace");
        alpha.put("promptCount", 2);
        alpha.put("createdAt", Instant.now().minusSeconds(86_400).toString());
        alpha.put("updatedAt", Instant.now().minusSeconds(3_600).toString());
        alpha.put("localPath", "/repos/alpha");
        alpha.put("repositoryUrl", "https://example.com/alpha.git");
        alpha.put("healthStatus", "HEALTHY");

        ObjectNode beta = mapper.createObjectNode();
        beta.put("id", "project-beta");
        beta.put("name", "Beta Workspace");
        beta.put("description", "Experimental prompts");
        beta.put("promptCount", 1);
        beta.put("createdAt", Instant.now().minusSeconds(172_800).toString());
        beta.put("updatedAt", Instant.now().minusSeconds(7_200).toString());
        beta.put("localPath", "/repos/beta");
        beta.put("repositoryUrl", "https://example.com/beta.git");
        beta.put("healthStatus", "HEALTHY");

        projects.put(alpha.path("id").asText(), alpha);
        projects.put(beta.path("id").asText(), beta);
        activeProjectId = alpha.path("id").asText();
    }

    private void seedPrompts() {
        ObjectNode promptOne = basePrompt("prompt-101", "Customer Support", "support",
                "Handle customer support messages.", buildRequest("openai", "gpt-4o"));
        promptOne.put("version", "1.0.0");
        promptOne.put("revision", 4);
        promptOne.put("status", "ACTIVE");
        promptOne.put("updatedAt", Instant.now().minusSeconds(5_000).toString());

        ObjectNode promptTwo = basePrompt("prompt-102", "Release Notes", "release",
                "Draft weekly release notes.", buildRequest("anthropic", "claude-3-5"));
        promptTwo.put("version", "0.9.0");
        promptTwo.put("revision", 2);
        promptTwo.put("status", "DRAFT");
        promptTwo.put("updatedAt", Instant.now().minusSeconds(9_000).toString());

        prompts.put(promptOne.path("id").asText(), promptOne);
        prompts.put(promptTwo.path("id").asText(), promptTwo);
    }

    private ObjectNode buildRequest(String vendor, String model) {
        ObjectNode request = mapper.createObjectNode();
        request.put("type", "chat/completion");
        request.put("vendor", vendor);
        request.put("model", model);
        request.set("parameters", mapper.createObjectNode()
                .put("temperature", 0.6)
                .put("maxTokens", 256)
                .put("topP", 1));
        ArrayNode messages = mapper.createArrayNode();
        messages.add(mapper.createObjectNode()
                .put("role", "system")
                .put("content", "You are a prompt assistant."));
        messages.add(mapper.createObjectNode()
                .put("role", "user")
                .put("content", "Summarize the request."));
        request.set("messages", messages);
        return request;
    }

    private List<String> segments(String path) {
        return Arrays.stream(path.split("/"))
                .filter(segment -> !segment.isBlank())
                .toList();
    }

    private String textOr(JsonNode node, String field, String fallback) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return fallback;
        }
        String text = value.asText();
        return text.isBlank() ? fallback : text;
    }

    private String bumpVersion(String current) {
        String[] parts = current.split("\\.");
        if (parts.length >= 3 && parts[2].matches("\\d+")) {
            int patch = Integer.parseInt(parts[2]);
            parts[2] = String.valueOf(patch + 1);
            return String.join(".", parts);
        }
        return current + ".1";
    }

    private void fulfillJson(Route route, int status, JsonNode body) {
        route.fulfill(new Route.FulfillOptions()
                .setStatus(status)
                .setContentType("application/json")
                .setBody(body == null ? "" : body.toString()));
    }

    private static final class PromptNotFoundException extends RuntimeException {
        PromptNotFoundException(String promptId) {
            super("Prompt not found: " + Objects.toString(promptId, "<null>"));
        }
    }
}
