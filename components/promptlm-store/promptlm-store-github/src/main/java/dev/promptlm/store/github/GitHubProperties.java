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

package dev.promptlm.store.github;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Properties;

@ConfigurationProperties(prefix = "promptlm.store.remote")
public class GitHubProperties {
    private static final String DEFAULT_BASE_URL = "https://api.github.com";
    private String username;
    private String token;
    private String baseUrl;
    private String endpoint;
    private boolean allowLoopbackHostAliases = true;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getBaseUrl() {
        if (baseUrl == null || baseUrl.isBlank()) {
            return DEFAULT_BASE_URL;
        }
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getEndpoint() {
        if (endpoint == null || endpoint.isBlank()) {
            return getBaseUrl();
        }
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public boolean isAllowLoopbackHostAliases() {
        return allowLoopbackHostAliases;
    }

    public void setAllowLoopbackHostAliases(boolean allowLoopbackHostAliases) {
        this.allowLoopbackHostAliases = allowLoopbackHostAliases;
    }

    public Properties asProperties() {
        Properties properties = new Properties();
        String resolvedUsername = getUsername();
        String resolvedToken = getToken();
        properties.setProperty("login", resolvedUsername != null ? resolvedUsername : "");
        properties.setProperty("oauth", resolvedToken != null ? resolvedToken : "");
        properties.setProperty("endpoint", getEndpoint());
        return properties;
    }
}
