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

import dev.promptlm.domain.promptspec.PromptSpec;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class IntVersioningStrategy implements VersioningStrategy {

    private static final String SNAPSHOT_SUFFIX = "-SNAPSHOT";
    private static final Pattern INTEGER_VERSION = Pattern.compile("^(\\d+)$");
    private static final Pattern SEMVER_VERSION = Pattern.compile("^(\\d+)\\.(\\d+)\\.(\\d+)$");

    @Override
    public String getNextDevelopmentVersion(PromptSpec spec) {
        if (spec.getVersion() == null || spec.getVersion().isBlank()) {
            return "1-SNAPSHOT";
        }

        String releaseVersion = normalizeReleaseVersion(spec.getVersion());
        Matcher integerMatcher = INTEGER_VERSION.matcher(releaseVersion);
        if (integerMatcher.matches()) {
            long version = Long.parseLong(integerMatcher.group(1));
            return (version + 1) + SNAPSHOT_SUFFIX;
        }

        Matcher semverMatcher = SEMVER_VERSION.matcher(releaseVersion);
        if (semverMatcher.matches()) {
            long major = Long.parseLong(semverMatcher.group(1));
            long minor = Long.parseLong(semverMatcher.group(2));
            long patch = Long.parseLong(semverMatcher.group(3));
            return major + "." + minor + "." + (patch + 1) + SNAPSHOT_SUFFIX;
        }

        throw new IllegalArgumentException("Unsupported prompt version format: " + spec.getVersion());
    }

    @Override
    public String calculateReleaseVersion(PromptSpec spec) {
        return spec.getVersion() == null || spec.getVersion().isBlank()
                ? "1"
                : normalizeReleaseVersion(spec.getVersion());
    }

    @Override
    public String calculateReleaseTag(PromptSpec spec) {
        return spec.getId() + "-v" + spec.getVersion();
    }

    private static String normalizeReleaseVersion(String version) {
        if (version.endsWith(SNAPSHOT_SUFFIX)) {
            return version.substring(0, version.length() - SNAPSHOT_SUFFIX.length());
        }
        return version;
    }

}
