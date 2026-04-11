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

import java.net.URL;

class GitHubRepository implements RemoteRepository {
    private final String ownerName;
    private final String name;
    private final URL htmlUrl;

    private GitHubRepository(String ownerName, String name, URL htmlUrl) {
        this.ownerName = ownerName;
        this.name = name;
        this.htmlUrl = htmlUrl;
    }

    public static GitHubRepository create(String ownerName, String name, URL htmlUrl) {
        return new GitHubRepository(ownerName, name, htmlUrl);
    }

    @Override
    public String getOwnerName() {

        return ownerName;
    }

    @Override
    public String getName() {

        return name;
    }

    @Override
    public URL getHtmlUrl() {

        return htmlUrl;
    }

    @Override
    public String getHttpTransportUrl() {
        return htmlUrl.toExternalForm();
    }
}
