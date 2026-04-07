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

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.Locale;

@Component
class TrustedRemotePolicy {

    private static final String PUBLIC_GITHUB_API_HOST = "api.github.com";
    private static final String PUBLIC_GITHUB_GIT_HOST = "github.com";

    private final GitHubProperties gitHubProperties;

    TrustedRemotePolicy(GitHubProperties gitHubProperties) {
        this.gitHubProperties = gitHubProperties;
    }

    public URI assertCloneImportRemoteAllowed(URI remoteUrl) {
        URI normalized = normalizeHttpRemote(remoteUrl);
        if (!isTrustedHttpRemote(normalized)) {
            throw new IllegalArgumentException(
                    "Remote repository host is not allowed for clone/import: " + normalized
            );
        }
        return normalized;
    }

    public boolean isTrustedForCredentialForwarding(String remoteUrl) {
        URI parsed = tryParseHttpRemote(remoteUrl);
        return parsed != null && isTrustedHttpRemote(parsed);
    }

    private boolean isTrustedHttpRemote(URI remoteUrl) {
        TrustedEndpoint trustedEndpoint = resolveTrustedEndpoint();
        if (!trustedEndpoint.scheme().equalsIgnoreCase(remoteUrl.getScheme())) {
            return false;
        }
        if (!hostsMatch(trustedEndpoint.host(), remoteUrl.getHost())) {
            return false;
        }
        return trustedEndpoint.port() == resolvePort(remoteUrl);
    }

    private boolean hostsMatch(String trustedHost, String remoteHost) {
        if (!StringUtils.hasText(trustedHost) || !StringUtils.hasText(remoteHost)) {
            return false;
        }

        String normalizedTrustedHost = trustedHost.toLowerCase(Locale.ROOT);
        String normalizedRemoteHost = remoteHost.toLowerCase(Locale.ROOT);
        if (normalizedTrustedHost.equals(normalizedRemoteHost)) {
            return true;
        }

        if (!gitHubProperties.isAllowLoopbackHostAliases()) {
            return false;
        }

        return isLoopbackHost(normalizedTrustedHost) && isLoopbackHost(normalizedRemoteHost);
    }

    private static boolean isLoopbackHost(String host) {
        return "localhost".equals(host)
                || "localtest.me".equals(host)
                || host.endsWith(".localtest.me")
                || host.startsWith("127.")
                || "0:0:0:0:0:0:0:1".equals(host)
                || "::1".equals(host);
    }

    private URI normalizeHttpRemote(URI remoteUrl) {
        if (remoteUrl == null) {
            throw new IllegalArgumentException("Remote repository URL must not be null");
        }
        if (!remoteUrl.isAbsolute()) {
            throw new IllegalArgumentException("Remote repository URL must be absolute: " + remoteUrl);
        }
        String scheme = remoteUrl.getScheme();
        if (!StringUtils.hasText(scheme)
                || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
            throw new IllegalArgumentException("Remote repository URL must use HTTP(S): " + remoteUrl);
        }
        if (!StringUtils.hasText(remoteUrl.getHost())) {
            throw new IllegalArgumentException("Remote repository URL host must not be empty: " + remoteUrl);
        }
        if (StringUtils.hasText(remoteUrl.getUserInfo())) {
            throw new IllegalArgumentException("Remote repository URL must not include inline credentials");
        }
        return remoteUrl.normalize();
    }

    private URI tryParseHttpRemote(String remoteUrl) {
        if (!StringUtils.hasText(remoteUrl)) {
            return null;
        }
        try {
            URI uri = URI.create(remoteUrl);
            String scheme = uri.getScheme();
            if (!StringUtils.hasText(scheme)) {
                return null;
            }
            String lowerScheme = scheme.toLowerCase(Locale.ROOT);
            if (!"http".equals(lowerScheme) && !"https".equals(lowerScheme)) {
                return null;
            }
            if (!StringUtils.hasText(uri.getHost())) {
                return null;
            }
            return uri.normalize();
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private TrustedEndpoint resolveTrustedEndpoint() {
        URI baseUri = URI.create(gitHubProperties.getBaseUrl());
        if (!StringUtils.hasText(baseUri.getScheme()) || !StringUtils.hasText(baseUri.getHost())) {
            throw new IllegalStateException(
                    "Invalid promptlm.store.remote.base-url; expected absolute HTTP(S) URL but was " + gitHubProperties.getBaseUrl()
            );
        }

        String scheme = baseUri.getScheme().toLowerCase(Locale.ROOT);
        String host = baseUri.getHost().toLowerCase(Locale.ROOT);
        int port = resolvePort(baseUri);

        if (PUBLIC_GITHUB_API_HOST.equals(host)) {
            return new TrustedEndpoint("https", PUBLIC_GITHUB_GIT_HOST, 443);
        }

        return new TrustedEndpoint(scheme, host, port);
    }

    private static int resolvePort(URI uri) {
        if (uri.getPort() > 0) {
            return uri.getPort();
        }
        if ("http".equalsIgnoreCase(uri.getScheme())) {
            return 80;
        }
        return 443;
    }

    private record TrustedEndpoint(String scheme, String host, int port) {}
}
