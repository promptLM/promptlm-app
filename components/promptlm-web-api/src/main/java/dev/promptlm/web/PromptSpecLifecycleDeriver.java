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

package dev.promptlm.web;

import dev.promptlm.domain.AppContext;
import dev.promptlm.domain.projectspec.ProjectSpec;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.PromptSpecLifecycleState;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.errors.MissingObjectException;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

/**
 * Derives the {@link PromptSpecLifecycleState} of a {@link PromptSpec} from
 * storage truth — i.e. by comparing on-disk YAML to the active project's Git
 * HEAD and to the corresponding {@code origin/<branch>} ref.
 *
 * <p>Returns {@code null} when the state cannot be derived (no active project,
 * no repo dir, no HEAD, etc.). Callers should treat {@code null} as "no
 * lifecycle information available" and surface the field as omitted in JSON
 * (which is the default behaviour because {@code PromptSpec.lifecycleState} is
 * {@code @JsonInclude(NON_NULL)}).
 *
 * <p>Never throws on I/O failures — diagnostic info is logged at WARN, and
 * derivation falls through to {@code null}. The lifecycle field is decorative
 * metadata for the UI; a Git read hiccup must not break the {@code GET}.
 *
 * @see <a href="https://github.com/promptLM/promptlm-app/issues/189">Issue #189</a>
 */
@Component
class PromptSpecLifecycleDeriver {

    private static final Logger log = LoggerFactory.getLogger(PromptSpecLifecycleDeriver.class);

    private final AppContext appContext;

    PromptSpecLifecycleDeriver(AppContext appContext) {
        this.appContext = appContext;
    }

    /**
     * Returns the lifecycle state of the given spec, or {@code null} when it
     * cannot be derived.
     */
    PromptSpecLifecycleState derive(PromptSpec spec) {
        if (spec == null) {
            return null;
        }
        Path repoDir = resolveRepoDir();
        if (repoDir == null) {
            return null;
        }
        Path specPath = resolveSpecPath(spec, repoDir);
        if (specPath == null) {
            return null;
        }
        try (Git git = Git.open(repoDir.toFile())) {
            Repository repo = git.getRepository();
            String relativeGitPath = toGitPath(repoDir, specPath);
            if (relativeGitPath == null) {
                return null;
            }

            byte[] workingTreeContent = Files.exists(specPath)
                    ? Files.readAllBytes(specPath)
                    : null;
            byte[] headContent = readBlobAtHead(repo, relativeGitPath);

            if (!Arrays.equals(workingTreeContent, headContent)) {
                // Working tree differs from HEAD (or HEAD has no blob yet for
                // this path). The change has been "saved" to disk but is not
                // captured by a commit yet.
                return PromptSpecLifecycleState.SAVED;
            }

            // Working tree matches HEAD; differentiate committed vs pushed.
            if (isHeadReachableFromOrigin(repo)) {
                return PromptSpecLifecycleState.PUSHED;
            }
            return PromptSpecLifecycleState.COMMITTED;
        } catch (IOException | RuntimeException e) {
            log.warn("Failed to derive lifecycle state for prompt {}/{} at {}: {}",
                    spec.getGroup(), spec.getName(), specPath, e.toString());
            return null;
        }
    }

    private Path resolveRepoDir() {
        ProjectSpec activeProject = appContext.getActiveProject();
        if (activeProject == null) {
            return null;
        }
        Path repoDir = activeProject.getRepoDir();
        if (repoDir == null) {
            return null;
        }
        Path normalized = repoDir.toAbsolutePath().normalize();
        if (!Files.isDirectory(normalized)) {
            return null;
        }
        return normalized;
    }

    private Path resolveSpecPath(PromptSpec spec, Path repoDir) {
        Path specPath = spec.getPath();
        if (specPath == null) {
            return null;
        }
        if (specPath.isAbsolute()) {
            return specPath.normalize();
        }
        return repoDir.resolve(specPath).normalize();
    }

    private String toGitPath(Path repoDir, Path specPath) {
        Path relative;
        try {
            relative = repoDir.relativize(specPath);
        } catch (IllegalArgumentException ex) {
            // specPath is not under repoDir — caller should not have passed it.
            return null;
        }
        return relative.toString().replace('\\', '/');
    }

    private byte[] readBlobAtHead(Repository repo, String relativeGitPath) throws IOException {
        ObjectId headId = repo.resolve("HEAD^{tree}");
        if (headId == null) {
            return null;
        }
        try (RevWalk walk = new RevWalk(repo);
             TreeWalk treeWalk = TreeWalk.forPath(repo, relativeGitPath, headId)) {
            if (treeWalk == null) {
                return null;
            }
            ObjectId blobId = treeWalk.getObjectId(0);
            if (blobId == null || blobId.equals(ObjectId.zeroId())) {
                return null;
            }
            try {
                return repo.open(blobId).getBytes();
            } catch (MissingObjectException missing) {
                return null;
            }
        }
    }

    /**
     * Returns {@code true} when the local HEAD commit is reachable from the
     * remote-tracking ref {@code refs/remotes/origin/<current-branch>}.
     *
     * <p>When no matching remote ref exists (e.g. the branch has never been
     * pushed, or the project has no remote configured), returns {@code false}
     * — the commit is "committed" but not "pushed".
     */
    private boolean isHeadReachableFromOrigin(Repository repo) throws IOException {
        ObjectId headId = repo.resolve("HEAD");
        if (headId == null) {
            return false;
        }
        String branch = repo.getBranch();
        if (branch == null) {
            return false;
        }
        Ref originRef = repo.findRef("refs/remotes/origin/" + branch);
        if (originRef == null) {
            return false;
        }
        ObjectId originId = originRef.getObjectId();
        if (originId == null) {
            return false;
        }
        try (RevWalk walk = new RevWalk(repo)) {
            RevCommit headCommit;
            RevCommit originCommit;
            try {
                headCommit = walk.parseCommit(headId);
                originCommit = walk.parseCommit(originId);
            } catch (MissingObjectException missing) {
                return false;
            }
            return walk.isMergedInto(headCommit, originCommit);
        }
    }
}
