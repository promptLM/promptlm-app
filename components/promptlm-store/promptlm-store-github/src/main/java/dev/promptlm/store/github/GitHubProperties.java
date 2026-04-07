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
